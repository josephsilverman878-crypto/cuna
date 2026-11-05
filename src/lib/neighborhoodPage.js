// Neighborhood pages (wave 5, item 5.3): the data behind /neighborhoods/:slug.
//
// This module runs in two places with the same logic: in the browser (the
// React page) and in Node at build time (scripts/prerender-neighborhoods.mjs
// writes a static HTML page per neighborhood so search engines get real
// text from a Vite SPA). It therefore takes the Supabase client as an
// argument and uses only fetch() and plain JS.
//
// Content is about the place: listings on Cuna, transit, schools and
// hospitals as facilities (names and addresses, no ratings), and recorded
// sale medians. Nothing about who lives there; fair housing applies.
//
// Sources: Cuna (listings, NTA 2020 shapes via public.neighborhoods),
// MTA subway stations (public.subway_stations, NYC Open Data 39hk-dx4f),
// NYC DOE school locations (NYC Open Data wg9x-4ke6), NYS Department of
// Health facilities (health.data.ny.gov vn5v-hh5r), NYC DOF Rolling Sales
// (usep-8jbt).

const SCHOOLS = 'https://data.cityofnewyork.us/resource/wg9x-4ke6.json'
const HOSPITALS = 'https://health.data.ny.gov/resource/vn5v-hh5r.json'
const DOF = 'https://data.cityofnewyork.us/resource/usep-8jbt.json'
export const MIN_RECORDS = 10

export const BOROUGH_DIGIT = { Manhattan: '1', Bronx: '2', Brooklyn: '3', Queens: '4', 'Staten Island': '5' }

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${url.split('?')[0]} ${res.status}`)
  return res.json()
}

// ---------------------------------------------------------------- geometry
function ringContains(ring, x, y) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// geometry: GeoJSON Polygon or MultiPolygon. Holes are respected.
export function geometryContains(geometry, lng, lat) {
  if (!geometry) return false
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : []
  return polys.some(rings => ringContains(rings[0], lng, lat) && !rings.slice(1).some(h => ringContains(h, lng, lat)))
}

export function bboxOf(geometry) {
  let minX = 180, minY = 90, maxX = -180, maxY = -90
  const walk = (c) => {
    if (typeof c[0] === 'number') { minX = Math.min(minX, c[0]); maxX = Math.max(maxX, c[0]); minY = Math.min(minY, c[1]); maxY = Math.max(maxY, c[1]) }
    else c.forEach(walk)
  }
  walk(geometry.coordinates)
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 }
}

// ---------------------------------------------------------------- shaping
export function shapeSchool(r) {
  return {
    name: r.location_name, grades: (r.grades_final_text || r.grades_text || '').replace(/0K/, 'K'),
    type: r.location_category_description || r.location_type_description || '',
    address: r.primary_address_line_1 ? titleCase(r.primary_address_line_1) : '',
    lng: Number(r.longitude), lat: Number(r.latitude),
  }
}

export function shapeHospital(r) {
  return { name: r.facility_name, address: r.address1 ? `${r.address1}, ${r.city || ''}` : '', lng: Number(r.longitude), lat: Number(r.latitude) }
}

export function titleCase(s) {
  return String(s || '').toLowerCase().replace(/\b([a-z])/g, c => c.toUpperCase())
}

export function groupStations(rows) {
  const byName = {}
  rows.forEach(s => {
    const k = s.complex_id || s.name
    const g = (byName[k] ||= { name: s.name, routes: new Set(), ada: false })
    ;(s.routes || []).forEach(r => g.routes.add(r))
    if (s.ada) g.ada = true
  })
  return Object.values(byName).map(g => ({ ...g, routes: [...g.routes].sort() })).sort((a, b) => a.name.localeCompare(b.name))
}

export function median(nums) {
  const a = nums.filter(n => Number.isFinite(n)).sort((x, y) => x - y)
  if (!a.length) return null
  const m = Math.floor(a.length / 2)
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2)
}

export function listingSummary(listings) {
  const rent = listings.filter(l => (l.listing_type || 'rent') === 'rent')
  const sale = listings.filter(l => l.listing_type === 'sale')
  return {
    count: listings.length, rent: rent.length, sale: sale.length,
    rent_median: rent.length >= MIN_RECORDS ? median(rent.map(l => Number(l.price))) : null,
    sale_median: sale.length >= MIN_RECORDS ? median(sale.map(l => Number(l.price))) : null,
  }
}

// DOF neighborhood names ("PARK SLOPE", "UPPER EAST SIDE (59-79)") against
// an NTA name ("Park Slope", "Upper East Side-Carnegie Hill"). Exact
// normalized match, or one is a prefix of the other's first segment.
export function dofNameMatches(dofName, ntaName) {
  const norm = s => String(s || '').toUpperCase().replace(/\(.*?\)/g, '').replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
  const d = norm(dofName), n = norm(ntaName)
  if (!d || !n) return false
  if (d === n) return true
  const nFirst = norm(String(ntaName).split('-')[0])
  return d === nFirst || (d.length >= 6 && (nFirst.startsWith(d) || d.startsWith(nFirst)))
}

// ---------------------------------------------------------------- fetchers (single neighborhood, browser)
export async function fetchSchoolsIn(geometry) {
  const b = bboxOf(geometry)
  const rows = await getJson(`${SCHOOLS}?$select=location_name,grades_final_text,grades_text,location_category_description,location_type_description,primary_address_line_1,latitude,longitude&$where=latitude::number between ${b.minY} and ${b.maxY} AND longitude::number between ${b.minX} and ${b.maxX} AND status_descriptions='Open'&$limit=400`)
  return rows.map(shapeSchool).filter(s => geometryContains(geometry, s.lng, s.lat)).sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchHospitalsIn(geometry) {
  const b = bboxOf(geometry)
  const rows = await getJson(`${HOSPITALS}?$select=facility_name,address1,city,latitude,longitude&$where=description='Hospital' AND latitude::number between ${b.minY} and ${b.maxY} AND longitude::number between ${b.minX} and ${b.maxX}&$limit=100`)
  return rows.map(shapeHospital).filter(h => geometryContains(geometry, h.lng, h.lat))
}

export async function fetchStationsIn(client, geometry) {
  const b = bboxOf(geometry)
  const { data, error } = await client.from('subway_stations').select('complex_id, name, routes, ada, lat, lng')
    .gte('lat', b.minY).lte('lat', b.maxY).gte('lng', b.minX).lte('lng', b.maxX).limit(300)
  if (error) throw error
  return groupStations((data || []).filter(s => geometryContains(geometry, s.lng, s.lat)))
}

export async function fetchListingsIn(client, neighborhoodId) {
  const { data, error } = await client.from('listings')
    .select('id, address, price, listing_type, property_type, bedrooms, bathrooms, sqft, status, photos, neighborhood')
    .eq('neighborhood_id', neighborhoodId).in('status', ['active', 'in_contract']).order('created_at', { ascending: false }).limit(200)
  if (error) throw error
  return data || []
}

// All DOF medians for one borough, grouped by neighborhood name (one call
// per borough; the Market API does the same server-side for the browser).
export async function fetchDofMedians(boroughDigit, since) {
  const groups = {
    houses: ['01 ONE FAMILY DWELLINGS', '02 TWO FAMILY DWELLINGS', '03 THREE FAMILY DWELLINGS'],
    coops: ['09 COOPS - WALKUP APARTMENTS', '10 COOPS - ELEVATOR APARTMENTS', '17 CONDO COOPS'],
    condos: ['12 CONDOS - WALKUP APARTMENTS', '13 CONDOS - ELEVATOR APARTMENTS', '04 TAX CLASS 1 CONDOS', '15 CONDOS - 2-10 UNIT RESIDENTIAL'],
  }
  const out = []
  for (const [group, cats] of Object.entries(groups)) {
    const params = new URLSearchParams({
      $select: 'neighborhood,count(*) as n,median(sale_price) as median_price,max(sale_date) as latest',
      $where: `sale_price>100000 AND sale_date>='${since}' AND borough='${boroughDigit}' AND building_class_category in(${cats.map(c => `'${c}'`).join(',')})`,
      $group: 'neighborhood', $limit: '500',
    })
    const rows = await getJson(`${DOF}?${params}`)
    rows.filter(r => Number(r.n) >= MIN_RECORDS).forEach(r => out.push({ neighborhood: r.neighborhood, group, n: Number(r.n), median: Math.round(Number(r.median_price)), latest: (r.latest || '').slice(0, 10) }))
  }
  return out
}

export function dofRowsFor(ntaName, dofRows) {
  return dofRows.filter(r => dofNameMatches(r.neighborhood, ntaName))
}

export function sinceTwelveMonths() {
  const d = new Date()
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 12)
  return d.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------- page text
export const GROUP_LABELS = { houses: '1–3 family houses', coops: 'co-ops', condos: 'condos' }

export function pageTitle(hood) {
  return `${hood.name}, ${hood.borough} apartments and homes | Cuna`
}

export function pageDescription(model) {
  const bits = []
  const { hood, listings, stations, schools, hospitals, dof } = model
  bits.push(`${hood.name} in ${hood.borough}, New York City.`)
  if (listings.count) bits.push(`${listings.count} home${listings.count === 1 ? '' : 's'} on Cuna now.`)
  if (stations.length) bits.push(`Subway: ${stations.slice(0, 4).map(s => `${s.name} (${s.routes.join(' ')})`).join(', ')}.`)
  if (schools.length) bits.push(`${schools.length} public school${schools.length === 1 ? '' : 's'}.`)
  if (hospitals.length) bits.push(`${hospitals.length} hospital${hospitals.length === 1 ? '' : 's'}.`)
  const d = dof.find(r => r.group === 'condos') || dof[0]
  if (d) bits.push(`Median recorded ${GROUP_LABELS[d.group]} sale $${d.median.toLocaleString()} (${d.n} sales).`)
  return bits.join(' ').slice(0, 300)
}
