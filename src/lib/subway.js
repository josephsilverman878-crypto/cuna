import { supabase } from './supabase'
import { MAPBOX_TOKEN } from './mapbox'

// Nearby subway stations for a listing. The station list is the MTA's
// (NY Open Data 39hk-dx4f), loaded into public.subway_stations by
// 44-wave2-listing-page.sql, never fetched live per page. The RPC returns the
// closest station complexes within a 20-minute walk with the straight-line
// distance; walking times come from one Mapbox Matrix request (walking
// profile) when the token is present, otherwise from a flat estimate.

export const ROUTE_COLORS = {
  '1': '#EE352E', '2': '#EE352E', '3': '#EE352E',
  '4': '#00933C', '5': '#00933C', '6': '#00933C',
  '7': '#B933AD',
  'A': '#0039A6', 'C': '#0039A6', 'E': '#0039A6',
  'B': '#FF6319', 'D': '#FF6319', 'F': '#FF6319', 'M': '#FF6319',
  'G': '#6CBE45',
  'J': '#996633', 'Z': '#996633',
  'L': '#A7A9AC',
  'N': '#FCCC0A', 'Q': '#FCCC0A', 'R': '#FCCC0A', 'W': '#FCCC0A',
  'S': '#808183', 'SIR': '#0039A6',
}
export const DARK_TEXT_ROUTES = new Set(['N', 'Q', 'R', 'W'])

// Straight-line metres -> walking minutes, the fallback when Mapbox is
// unavailable: city blocks add about a quarter to the crow-flies distance,
// at a steady 80 m per minute.
export function estimateWalkMinutes(distanceM) {
  if (!Number.isFinite(distanceM)) return null
  return Math.max(1, Math.round((distanceM * 1.25) / 80))
}

export async function nearbyStations(lng, lat, { limit = 5, maxM = 1600 } = {}) {
  const { data, error } = await supabase.rpc('nearby_subway_stations', { p_lng: lng, p_lat: lat, p_limit: limit, p_max_m: maxM })
  if (error) throw error
  return (data || []).map(s => ({ ...s, walk_min: estimateWalkMinutes(s.distance_m), walk_source: 'estimate' }))
}

// Fills walk_min / walk_m from Mapbox's walking matrix (origin = the listing,
// destinations = the stations). One request, up to 24 destinations. Any
// failure leaves the estimates in place.
export async function addWalkingTimes(origin, stations) {
  if (!MAPBOX_TOKEN || !stations.length) return stations
  const coords = [origin, ...stations.map(s => [s.lng, s.lat])].map(c => c.join(',')).join(';')
  const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/walking/${coords}?sources=0&annotations=duration,distance&access_token=${MAPBOX_TOKEN}`
  try {
    const res = await fetch(url)
    if (!res.ok) return stations
    const json = await res.json()
    const durations = json.durations?.[0] || []
    const distances = json.distances?.[0] || []
    return stations.map((s, i) => {
      const d = durations[i + 1]
      const m = distances[i + 1]
      if (!Number.isFinite(d)) return s
      return { ...s, walk_min: Math.max(1, Math.round(d / 60)), walk_m: Number.isFinite(m) ? Math.round(m) : s.distance_m, walk_source: 'mapbox' }
    })
  } catch (err) {
    console.error('Walking times unavailable:', err)
    return stations
  }
}

export function formatDistance(m) {
  if (!Number.isFinite(m)) return ''
  const miles = m / 1609.344
  return miles < 0.1 ? `${Math.round(m * 3.28084)} ft` : `${miles.toFixed(1)} mi`
}
