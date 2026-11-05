import { supabase } from './supabase'

// Neighborhood areas (public.neighborhoods, 42-wave1-search.sql): NYC's 2020
// Neighborhood Tabulation Areas trimmed around Cuna's own street-drawn areas.
// kind = 'neighborhood' | 'park' | 'airport' | 'cemetery' | 'other'. Only
// kind 'neighborhood' appears in lists, filters and search; the others are
// drawn on the map so it reads as a map, and never match a listing.
//
// The shapes come back as one ~500 KB FeatureCollection (simplified
// geometries) from the neighborhoods_geojson RPC and are cached for the
// session. The lightweight list (no shapes) is a plain table read.

const SHAPES_KEY = 'cuna:areas:v1'
let shapesMemo = null
let listMemo = null

export const KIND_LABEL = { neighborhood: 'Neighborhood', park: 'Park', airport: 'Airport', cemetery: 'Cemetery', other: 'Area' }
export const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island']

function byBoroughThenName(a, b) {
  const bi = BOROUGHS.indexOf(a.borough) - BOROUGHS.indexOf(b.borough)
  return bi !== 0 ? bi : a.name.localeCompare(b.name)
}

// [{ id, slug, name, borough, kind }] for kind = neighborhood, grouped-ready.
export async function listNeighborhoods() {
  if (listMemo) return listMemo
  const { data, error } = await supabase
    .from('neighborhoods')
    .select('id, slug, name, borough, kind, area_km2')
    .eq('kind', 'neighborhood')
  if (error) throw error
  listMemo = (data || []).sort(byBoroughThenName)
  return listMemo
}

// { geojson, all, byId } with every kind; `all` is the properties list.
export async function loadAreaShapes() {
  if (shapesMemo) return shapesMemo
  try {
    const raw = sessionStorage.getItem(SHAPES_KEY)
    if (raw) {
      shapesMemo = hydrate(JSON.parse(raw))
      return shapesMemo
    }
  } catch { /* storage unavailable; fall through to the network */ }
  const { data, error } = await supabase.rpc('neighborhoods_geojson')
  if (error) throw error
  shapesMemo = hydrate(data)
  try { sessionStorage.setItem(SHAPES_KEY, JSON.stringify(data)) } catch { /* too big for this browser; fine */ }
  return shapesMemo
}

function hydrate(geojson) {
  const all = (geojson?.features || []).map(f => f.properties)
  const byId = new Map(all.map(a => [a.id, a]))
  return { geojson, all, byId }
}

// Groups a neighborhood list by borough, in borough order.
export function groupByBorough(list) {
  const groups = new Map()
  for (const b of BOROUGHS) groups.set(b, [])
  for (const n of list) {
    if (!groups.has(n.borough)) groups.set(n.borough, [])
    groups.get(n.borough).push(n)
  }
  return [...groups.entries()].filter(([, items]) => items.length > 0)
}

// Resolves typed names (the old renter_profiles.neighborhoods list) to ids.
export function idsForNames(list, names) {
  const wanted = new Set((names || []).map(n => String(n || '').trim().toLowerCase()).filter(Boolean))
  if (wanted.size === 0) return []
  return list.filter(n => wanted.has(n.name.toLowerCase())).map(n => n.id)
}
