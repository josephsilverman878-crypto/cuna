// Market data: median sale prices and counts by neighborhood for the last
// twelve months, straight from NYC DOF Rolling Sales (NYC Open Data
// usep-8jbt) using SoQL's server-side median. No key, no database.
//
// GET /api/market            -> every borough
// GET /api/market?borough=3  -> one borough (1 Manhattan .. 5 Staten Island)
//
// Three grouped queries (houses, co-ops, condos). Sales under $100,000 are
// left out: in the DOF file those are mostly transfers between family
// members or into an LLC, not market sales. A bucket with fewer than
// MIN_RECORDS sales is dropped here, so a thin median never reaches a page.
// The CDN keeps an answer for a day.

const DOF = 'https://data.cityofnewyork.us/resource/usep-8jbt.json'
const MIN_RECORDS = 10
const MIN_PRICE = 100000

const GROUPS = {
  houses: ['01 ONE FAMILY DWELLINGS', '02 TWO FAMILY DWELLINGS', '03 THREE FAMILY DWELLINGS'],
  coops: ['09 COOPS - WALKUP APARTMENTS', '10 COOPS - ELEVATOR APARTMENTS', '17 CONDO COOPS'],
  condos: ['12 CONDOS - WALKUP APARTMENTS', '13 CONDOS - ELEVATOR APARTMENTS', '04 TAX CLASS 1 CONDOS', '15 CONDOS - 2-10 UNIT RESIDENTIAL'],
}

function monthsAgoIso(n) {
  const d = new Date()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() - n)
  return d.toISOString().slice(0, 10)
}

async function groupQuery(group, categories, since, borough) {
  const inList = categories.map(c => `'${c}'`).join(',')
  let where = `sale_price>${MIN_PRICE} AND sale_date>='${since}' AND building_class_category in(${inList})`
  if (borough) where += ` AND borough='${borough}'`
  const params = new URLSearchParams({
    $select: 'borough,neighborhood,count(*) as n,median(sale_price) as median_price,max(sale_date) as latest',
    $where: where,
    $group: 'borough,neighborhood',
    $limit: '2000',
  })
  const res = await fetch(`${DOF}?${params}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`DOF ${res.status}`)
  const rows = await res.json()
  return rows
    .filter(r => Number(r.n) >= MIN_RECORDS)
    .map(r => ({ borough: String(r.borough), neighborhood: r.neighborhood, group, n: Number(r.n), median: Math.round(Number(r.median_price)), latest: (r.latest || '').slice(0, 10) }))
}

export default async function handler(req, res) {
  const borough = String(req.query?.borough || '').trim()
  if (borough && !/^[1-5]$/.test(borough)) return res.status(400).json({ error: 'borough must be 1-5' })
  const since = monthsAgoIso(12)
  try {
    const parts = await Promise.all(Object.entries(GROUPS).map(([g, cats]) => groupQuery(g, cats, since, borough)))
    const rows = parts.flat()
    const asOf = rows.reduce((m, r) => (r.latest > m ? r.latest : m), '')
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400')
    return res.status(200).json({
      source: 'NYC Department of Finance Rolling Sales (NYC Open Data usep-8jbt)',
      window: { from: since, to: asOf || null },
      min_records: MIN_RECORDS,
      rows,
    })
  } catch (err) {
    console.error('market fetch failed:', err.message)
    return res.status(502).json({ error: 'NYC Open Data did not answer' })
  }
}
