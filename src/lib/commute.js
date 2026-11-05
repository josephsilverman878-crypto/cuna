import { MAPBOX_TOKEN } from './mapbox'
import { geocodeAddress, GeocodeError } from './geocode'

// Commute times from a listing to a destination the renter types. The
// destination is found with NYC GeoSearch (free, NYC only); walking and
// driving times come from the Mapbox Directions API. Mapbox has no public
// transit routing, so there is no subway time here (see Needs Joseph NJ-4).
// The last destination is remembered in this browser only.

const KEY = 'cuna:commute-destination:v1'

export function loadDestination() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveDestination(d) {
  try {
    if (d) localStorage.setItem(KEY, JSON.stringify(d))
    else localStorage.removeItem(KEY)
  } catch { /* storage unavailable */ }
}

// Free-text -> { label, lat, lng }. Accepts addresses and well-known places
// GeoSearch knows ("Grand Central", "Columbia University", "Union Square").
export async function findDestination(text) {
  const q = String(text || '').trim()
  if (!q) throw new GeocodeError('Type a destination first.', 'not_found')
  try {
    const res = await fetch(`https://geosearch.planninglabs.nyc/v2/search?size=1&text=${encodeURIComponent(q)}`, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json()
    const f = (json.features || [])[0]
    if (!f?.geometry?.coordinates) throw new GeocodeError('We could not find that place in New York City. Try a street address.', 'not_found')
    const [lng, lat] = f.geometry.coordinates
    return { label: f.properties?.label || q, lat, lng }
  } catch (err) {
    if (err instanceof GeocodeError) throw err
    throw new GeocodeError('The place lookup did not answer. Try again in a moment.', 'network')
  }
}

async function directions(profile, from, to) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from[0]},${from[1]};${to[0]},${to[1]}?overview=false&access_token=${MAPBOX_TOKEN}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(profile + ' ' + res.status)
  const json = await res.json()
  const route = json.routes?.[0]
  if (!route) throw new Error(profile + ': no route')
  return { minutes: Math.max(1, Math.round(route.duration / 60)), meters: Math.round(route.distance) }
}

// { walking: { minutes, meters } | null, driving: { minutes, meters } | null }
export async function commuteTimes(from, to) {
  if (!MAPBOX_TOKEN) return { walking: null, driving: null, unavailable: true }
  const [walking, driving] = await Promise.all([
    directions('walking', from, to).catch(err => { console.error('Walking route:', err); return null }),
    directions('driving-traffic', from, to).catch(() => directions('driving', from, to).catch(err => { console.error('Driving route:', err); return null })),
  ])
  return { walking, driving, unavailable: false }
}

export function formatMinutes(min) {
  if (!Number.isFinite(min)) return '—'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}
