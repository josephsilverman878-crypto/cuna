// Recorded sales for one tax lot (BBL) from NYC public records only:
//   - DOF Rolling Sales (NYC Open Data usep-8jbt): closed sales, with unit
//   - ACRIS (NYC Open Data): Real Property Legals (8h5j-fqxa) -> Master
//     (bnx9-e6tj), deed-type documents with an amount
// GET /api/recorded-sales?bbl=3010110023
//
// Results are cached per BBL in public.recorded_sales_cache (service role;
// no client role can read it) for 7 days. The page shows "Source: NYC
// Department of Finance, as of <date>", where the date is the newest
// sale_date / good_through_date the datasets returned. Co-op sales are
// share transfers that often never reach these records; the page says so.
//
// Env vars (Vercel, server-side only): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from '@supabase/supabase-js'

const DOF = 'https://data.cityofnewyork.us/resource/usep-8jbt.json'
const ACRIS_LEGALS = 'https://data.cityofnewyork.us/resource/8h5j-fqxa.json'
const ACRIS_MASTER = 'https://data.cityofnewyork.us/resource/bnx9-e6tj.json'
const DEED_TYPES = ['DEED', 'DEEDO', 'DEED, LE', 'DEED, RC', 'DEED, TS']
const CACHE_DAYS = 7

function splitBbl(bbl) {
  return { borough: String(Number(bbl.slice(0, 1))), block: String(Number(bbl.slice(1, 6))), lot: String(Number(bbl.slice(6, 10))) }
}

async function soda(url, params) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${url}?${qs}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${url} ${res.status}`)
  return res.json()
}

async function fetchDof(bbl) {
  const { borough, block, lot } = splitBbl(bbl)
  const rows = await soda(DOF, {
    $where: `borough='${borough}' AND block='${block}' AND lot='${lot}'`,
    $order: 'sale_date DESC', $limit: '50',
  })
  const sales = rows
    .filter(r => Number(r.sale_price) > 0)
    .map(r => ({
      source: 'dof', date: (r.sale_date || '').slice(0, 10), price: Number(r.sale_price),
      address: r.address || null, unit: (r.apartment_number || '').trim() || null,
      building_class: r.building_class_category || null, units: r.total_units ? Number(r.total_units) : null,
    }))
  const asOf = rows.reduce((m, r) => (r.sale_date && r.sale_date > m ? r.sale_date : m), '')
  return { sales, asOf: asOf ? asOf.slice(0, 10) : null }
}

async function fetchAcris(bbl) {
  const { borough, block, lot } = splitBbl(bbl)
  const legals = await soda(ACRIS_LEGALS, {
    $where: `borough='${borough}' AND block='${block}' AND lot='${lot}'`,
    $select: 'document_id,unit,street_number,street_name,good_through_date', $limit: '400',
  })
  if (!legals.length) return { sales: [], asOf: null }
  const unitOf = new Map(legals.map(l => [l.document_id, (l.unit || '').trim() || null]))
  const ids = [...unitOf.keys()]
  const sales = []
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100).map(id => `'${id.replace(/'/g, '')}'`).join(',')
    const docs = await soda(ACRIS_MASTER, {
      $where: `document_id in(${chunk}) AND doc_type in(${DEED_TYPES.map(t => `'${t}'`).join(',')}) AND document_amt > 0`,
      $select: 'document_id,doc_type,document_amt,document_date,recorded_datetime', $limit: '400',
    })
    for (const d of docs) {
      sales.push({
        source: 'acris', date: ((d.document_date || d.recorded_datetime) || '').slice(0, 10), price: Number(d.document_amt),
        unit: unitOf.get(d.document_id) || null, doc_type: d.doc_type, document_id: d.document_id,
        recorded: (d.recorded_datetime || '').slice(0, 10),
      })
    }
  }
  sales.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const asOf = legals.reduce((m, l) => (l.good_through_date && l.good_through_date > m ? l.good_through_date : m), '')
  return { sales: sales.slice(0, 50), asOf: asOf ? asOf.slice(0, 10) : null }
}

export default async function handler(req, res) {
  const bbl = String(req.query?.bbl || '').trim()
  if (!/^[1-5][0-9]{9}$/.test(bbl)) return res.status(400).json({ error: 'bbl must be 10 digits' })
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null

  if (supabase) {
    const { data: cached } = await supabase.from('recorded_sales_cache').select('dof, acris, dof_as_of, acris_as_of, fetched_at').eq('bbl', bbl).maybeSingle()
    if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_DAYS * 86400000) {
      res.setHeader('Cache-Control', 'public, max-age=3600')
      return res.status(200).json({ bbl, dof: cached.dof, acris: cached.acris, dof_as_of: cached.dof_as_of, acris_as_of: cached.acris_as_of, cached: true })
    }
  }

  let dof = { sales: [], asOf: null }, acris = { sales: [], asOf: null }
  const errors = []
  try { dof = await fetchDof(bbl) } catch (err) { errors.push('dof'); console.error('DOF fetch failed:', err.message) }
  try { acris = await fetchAcris(bbl) } catch (err) { errors.push('acris'); console.error('ACRIS fetch failed:', err.message) }
  if (errors.length === 2) return res.status(502).json({ error: 'NYC Open Data did not answer' })

  if (supabase && errors.length === 0) {
    const { error } = await supabase.from('recorded_sales_cache').upsert({
      bbl, dof: dof.sales, acris: acris.sales, dof_as_of: dof.asOf, acris_as_of: acris.asOf, fetched_at: new Date().toISOString(),
    })
    if (error) console.error('recorded_sales_cache write failed:', error.message)
  }
  res.setHeader('Cache-Control', 'public, max-age=3600')
  return res.status(200).json({ bbl, dof: dof.sales, acris: acris.sales, dof_as_of: dof.asOf, acris_as_of: acris.asOf, cached: false, partial: errors })
}
