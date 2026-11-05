import { supabase } from './supabase'

// Address -> point, through NYC Planning Labs GeoSearch (free, no key, NYC
// only). Used by the post/edit forms before the listing row is written: the
// client stores lat/lng/bbl/bin, and the database trigger
// listings_assign_neighborhood then places the listing in a neighborhood by
// point-in-polygon. The neighborhood field is never typed by the poster when
// a point exists.
//
// GeoSearch returns the best match even for a street it only partly
// recognises, so a result only counts when it carries a house number: a
// street-centroid "fallback" would put a listing blocks from the real
// building and in the wrong neighborhood.

const GEOSEARCH = 'https://geosearch.planninglabs.nyc/v2/search'

export class GeocodeError extends Error {
  constructor(message, kind) {
    super(message)
    this.kind = kind   // 'not_found' | 'imprecise' | 'network'
  }
}

export function formatAddressQuery({ address, city, state, zip_code }) {
  const line2 = [state || 'NY', zip_code].filter(Boolean).join(' ')
  return [address, city || 'New York', line2].map(s => String(s || '').trim()).filter(Boolean).join(', ')
}

// Resolves to { lat, lng, bbl, bin, label, borough, zip, confidence, match_type }
// or throws GeocodeError.
export async function geocodeAddress(fields) {
  const text = formatAddressQuery(fields)
  if (!String(fields.address || '').trim()) throw new GeocodeError('Enter a street address first.', 'not_found')
  let json
  try {
    const res = await fetch(`${GEOSEARCH}?size=3&text=${encodeURIComponent(text)}`, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    json = await res.json()
  } catch (err) {
    throw new GeocodeError('The address lookup service did not answer. Check your connection and try again.', 'network')
  }
  const features = Array.isArray(json?.features) ? json.features : []
  const exact = features.find(f => f?.properties?.housenumber && f?.geometry?.coordinates)
  if (!exact) {
    if (features.length === 0) throw new GeocodeError('We could not find that address in New York City. Check the street number and spelling.', 'not_found')
    throw new GeocodeError('We found the street but not that building number. Check the number and try again.', 'imprecise')
  }
  const p = exact.properties
  const [lng, lat] = exact.geometry.coordinates
  return {
    lat, lng,
    bbl: p.addendum?.pad?.bbl || null,
    bin: p.addendum?.pad?.bin || null,
    label: p.label || null,
    borough: p.borough || null,
    zip: p.postalcode || null,
    confidence: p.confidence ?? null,
    match_type: p.match_type || null,
  }
}

// Which Cuna area a point falls in: { id, slug, name, borough, kind } or null.
// Mirrors what the database trigger will do on save.
export async function neighborhoodForPoint(lng, lat) {
  const { data, error } = await supabase.rpc('neighborhood_for_point', { p_lng: lng, p_lat: lat })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return row || null
}

// The listing columns a successful geocode fills.
export function geocodeColumns(g) {
  if (!g) return { lat: null, lng: null, bbl: null, bin: null, geocode_label: null, geocoded_at: null }
  return {
    lat: g.lat, lng: g.lng, bbl: g.bbl, bin: g.bin,
    geocode_label: g.label, geocoded_at: g.geocoded_at || new Date().toISOString(),
  }
}
