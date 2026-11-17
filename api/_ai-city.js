// Grounding data for the neighborhood guide: everything the assistant is
// allowed to say about a neighborhood comes from the rows built here.
//
//   - Neighborhoods: public.neighborhoods (Cuna's boundaries), through the
//     neighborhoods_geojson() function the map already uses.
//   - Subway lines: public.subway_stations (MTA station list), the stations
//     that fall inside each Cuna boundary.
//   - Live listings: public.listings, active only, counted per neighborhood.
//   - Reference price ranges: src/lib/neighborhoods.js, the same reviewed
//     table the classic quiz shows (rent ranges from published median asking
//     rents, sale ranges from NYC Department of Finance recorded sales). It
//     covers 30 named areas; every other neighborhood has no price figure
//     and the assistant must say so.
//
// Everything is read with the public (anon) key: nothing here can see data
// a visitor could not. The result is kept in memory for 30 minutes per
// server instance.
import { NEIGHBORHOODS as REFERENCE } from '../src/lib/neighborhoods.js'
import { geometryContains, bboxOf, median } from '../src/lib/neighborhoodPage.js'
import { publicClient, sha256, stableJson, nyDay } from './_ai-store.js'

export const REFERENCE_PERIOD = 'Oct 2025–Sep 2026'
export const BOUNDARY_NOTE =
  "Neighborhoods, subway lines and Cuna listing counts use Cuna's neighborhood boundaries. Reference rent and sale ranges come from the named source's own area of the same name, which can be drawn differently."

const TTL_MS = 30 * 60 * 1000
let memo = null

const RENT_KEYS = { studio: 'studio', '1': 'one_bed', '2': 'two_bed' }
const RENT_LABEL = { studio: 'studio', '1': 'one-bedroom', '2': 'two-bedroom' }
const SALE_LABEL = { condo: 'Condos', coop: 'Co-ops', townhouse_multifamily: '1–3 family houses' }

export function money(n) {
  return '$' + Math.round(n).toLocaleString('en-US')
}

export function milesBetween(a, b) {
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b[1] - a[1]), dLng = rad(b[0] - a[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2
  return 3958.8 * 2 * Math.asin(Math.sqrt(h))
}

function sortRoutes(set) {
  return [...set].sort((a, b) => (/^\d/.test(a) === /^\d/.test(b) ? a.localeCompare(b, 'en', { numeric: true }) : /^\d/.test(a) ? -1 : 1))
}

// The reference row for a Cuna neighborhood: same slug, or (for the areas
// the city's map splits into parts, such as Bushwick East and West) the
// reference area in the same borough whose name the neighborhood's name
// starts with. The borough check matters: Queens has its own Murray Hill.
function referenceFor(slug, name, borough, reference) {
  return reference.find(r => r.id === slug && r.borough === borough) ||
    reference.find(r => r.borough === borough && name.startsWith(r.name)) || null
}

// Pure, so the tests can build a city from fixtures.
//   features:  GeoJSON features with properties { id, slug, name, borough, kind }
//   stations:  [{ name, routes, lat, lng }]
//   listings:  [{ neighborhood_id, price, bedrooms, listing_type }]
export function buildCity({ features = [], stations = [], listings = [], reference = REFERENCE, today = nyDay() }) {
  const hoods = []
  for (const f of features) {
    const p = f.properties || {}
    if (p.kind !== 'neighborhood' || !f.geometry) continue
    const box = bboxOf(f.geometry)
    const routes = new Set()
    for (const s of stations) {
      if (s.lat < box.minY || s.lat > box.maxY || s.lng < box.minX || s.lng > box.maxX) continue
      if (geometryContains(f.geometry, s.lng, s.lat)) (s.routes || []).forEach(r => routes.add(r))
    }
    const mine = listings.filter(l => l.neighborhood_id === p.id)
    const rentals = mine.filter(l => l.listing_type !== 'sale')
    const sales = mine.filter(l => l.listing_type === 'sale')
    const ref = referenceFor(p.slug, p.name, p.borough, reference)
    hoods.push({
      id: p.id, slug: p.slug, name: p.name, borough: p.borough,
      center: [box.cx, box.cy],
      lines: sortRoutes(routes),
      ref,
      refArea: ref ? ref.name : null,
      listings: {
        rent: { count: rentals.length, median: median(rentals.map(l => Number(l.price))), prices: rentals.map(l => ({ price: Number(l.price), bedrooms: l.bedrooms })) },
        sale: { count: sales.length, median: median(sales.map(l => Number(l.price))), prices: sales.map(l => ({ price: Number(l.price), bedrooms: l.bedrooms })) },
      },
    })
  }
  hoods.sort((a, b) => a.slug.localeCompare(b.slug))
  const version = sha256(stableJson({
    period: REFERENCE_PERIOD,
    hoods: hoods.map(h => [h.slug, h.lines.join(''), h.refArea, h.listings.rent.count, h.listings.rent.median, h.listings.sale.count, h.listings.sale.median]),
  })).slice(0, 16)
  return { hoods, bySlug: new Map(hoods.map(h => [h.slug, h])), stations, version, asOf: today }
}

export async function loadCity(env = process.env) {
  if (memo && Date.now() - memo.at < TTL_MS) return memo.city
  const db = publicClient(env)
  if (!db) throw Object.assign(new Error('public data client missing'), { code: 'data' })
  const [shapes, stations, listings] = await Promise.all([
    db.rpc('neighborhoods_geojson'),
    db.from('subway_stations').select('name, routes, lat, lng').limit(2000),
    db.from('listings').select('neighborhood_id, price, bedrooms, listing_type').eq('status', 'active').not('neighborhood_id', 'is', null).limit(5000),
  ])
  if (shapes.error || stations.error || listings.error) {
    throw Object.assign(new Error('grounding data could not be read'), { code: 'data' })
  }
  const city = buildCity({ features: shapes.data?.features || [], stations: stations.data || [], listings: listings.data || [] })
  if (city.hoods.length === 0) throw Object.assign(new Error('no neighborhoods'), { code: 'data' })
  memo = { at: Date.now(), city }
  return city
}

// Subway lines with a station within about a third of a mile of a point.
export function linesNear(city, point, miles = 0.35) {
  const routes = new Set()
  for (const s of city.stations) {
    if (milesBetween(point, [s.lng, s.lat]) <= miles) (s.routes || []).forEach(r => routes.add(r))
  }
  return sortRoutes(routes)
}

// The figures Cuna holds for one neighborhood, each with its source, "as
// of" and whose boundary it is. `mode` is 'rent' or 'buy'; `bedrooms` is
// 'studio' | '1' | '2' | '3+' | null.
export function figuresFor(hood, mode, bedrooms, asOf) {
  const out = []
  const ref = hood.ref
  if (mode === 'rent') {
    const keys = bedrooms && RENT_KEYS[bedrooms] ? [bedrooms] : bedrooms === '3+' ? [] : ['studio', '1', '2']
    for (const k of keys) {
      const r = ref?.rent_ranges?.[RENT_KEYS[k]]
      if (!r || !Number.isFinite(r.min) || !Number.isFinite(r.max)) continue
      out.push({
        key: 'rent_' + k, min: r.min, max: r.max,
        label: `Typical asking rent, ${RENT_LABEL[k]}`,
        value: `${money(r.min)}–${money(r.max)} a month`,
        source: 'StreetEasy published median asking rents (the 12-month median, plus and minus 15%)',
        as_of: REFERENCE_PERIOD,
        boundary: `StreetEasy's area named ${hood.refArea}`,
      })
    }
    if (hood.listings.rent.count > 0) {
      out.push({
        key: 'cuna_rent', min: hood.listings.rent.median, max: hood.listings.rent.median,
        label: 'Rentals on Cuna now',
        value: `${hood.listings.rent.count} listed, median ${money(hood.listings.rent.median)} a month`,
        source: 'Cuna listings', as_of: asOf, boundary: "Cuna's neighborhood boundary",
      })
    }
  } else {
    for (const k of ['condo', 'coop', 'townhouse_multifamily']) {
      const r = ref?.sale_ranges?.[k]
      if (!r || !Number.isFinite(r.min) || !Number.isFinite(r.max)) continue
      out.push({
        key: 'sale_' + k, min: r.min, max: r.max,
        label: `${SALE_LABEL[k]}, recorded sale prices`,
        value: `${money(r.min)}–${money(r.max)}`,
        source: 'NYC Department of Finance recorded sales (middle half of sales, 25th to 75th percentile)',
        as_of: REFERENCE_PERIOD,
        boundary: `the Department of Finance's area named ${hood.refArea}`,
      })
    }
    if (hood.listings.sale.count > 0) {
      out.push({
        key: 'cuna_sale', min: hood.listings.sale.median, max: hood.listings.sale.median,
        label: 'For sale on Cuna now',
        value: `${hood.listings.sale.count} listed, median ${money(hood.listings.sale.median)}`,
        source: 'Cuna listings', as_of: asOf, boundary: "Cuna's neighborhood boundary",
      })
    }
  }
  return out
}

export function __resetCityMemo() { memo = null }
