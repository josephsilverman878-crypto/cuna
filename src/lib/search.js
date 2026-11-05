import { supabase } from './supabase'

// Feed search: filters, sort, map selection, and the search_listings RPC
// (42-wave1-search.sql). The RPC is SECURITY INVOKER, so the listings RLS
// still decides what the caller can see; it only narrows by the filters and
// by location (neighborhood ids and/or a drawn GeoJSON polygon).
//
// Paging goes through PostgREST's range on the RPC result, so the ORDER BY
// must be stable: every sort ends with id as the tiebreaker.

export const SORTS = [
  { id: 'newest',     label: 'Newest',                     col: 'created_at',          asc: false },
  { id: 'price_asc',  label: 'Price: low to high',         col: 'price',               asc: true },
  { id: 'price_desc', label: 'Price: high to low',         col: 'price',               asc: false },
  { id: 'net_asc',    label: 'Net effective: low to high', col: 'net_effective_price', asc: true },
  { id: 'sqft_desc',  label: 'Largest',                    col: 'sqft',                asc: false },
  { id: 'updated',    label: 'Recently updated',           col: 'updated_at',          asc: false },
]
export const PRICE_BASIS_OPTIONS = [
  { value: 'gross', label: 'Gross rent' },
  { value: 'net', label: 'Net effective rent' },
]
export const DEFAULT_SORT = 'newest'

// Stored labels, exactly as PostListing/EditListing write them into
// listings.amenities, so the array containment filter matches.
export const AMENITY_OPTIONS = [
  'Doorman', 'Elevator', 'Gym', 'Laundry', 'Dishwasher', 'Hardwood floors',
  'Roof deck', 'Central air', 'Washer/dryer', 'Parking', 'Storage',
]
export const PETS_OPTIONS = [
  { value: 'allowed', label: 'Pets allowed' },
  { value: 'cats_only', label: 'Cats only' },
  { value: 'none', label: 'No pets' },
]
export const BEDS_OPTIONS = [
  { value: '', label: 'Any' }, { value: '0', label: 'Studio+' }, { value: '1', label: '1+' },
  { value: '2', label: '2+' }, { value: '3', label: '3+' }, { value: '4', label: '4+' },
]
export const BATHS_OPTIONS = [
  { value: '', label: 'Any' }, { value: '1', label: '1+' }, { value: '1.5', label: '1.5+' },
  { value: '2', label: '2+' }, { value: '3', label: '3+' },
]

export const EMPTY_FILTERS = Object.freeze({
  price_min: '', price_max: '', beds_min: '', baths_min: '', sqft_min: '',
  amenities: [], pets: [], price_basis: 'gross', listing_type: 'rent',
})

export function normalizeFilters(f) {
  const n = { ...EMPTY_FILTERS, ...(f || {}) }
  n.amenities = Array.isArray(n.amenities) ? n.amenities.filter(a => AMENITY_OPTIONS.includes(a)) : []
  n.pets = Array.isArray(n.pets) ? n.pets.filter(p => PETS_OPTIONS.some(o => o.value === p)) : []
  n.price_basis = n.price_basis === 'net' ? 'net' : 'gross'
  n.listing_type = n.listing_type === 'sale' ? 'sale' : 'rent'
  for (const k of ['price_min', 'price_max', 'beds_min', 'baths_min', 'sqft_min']) {
    n[k] = n[k] === null || n[k] === undefined ? '' : String(n[k])
  }
  return n
}

function num(v) {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function countActiveFilters(filters, neighborhoodIds = [], area = null) {
  const f = normalizeFilters(filters)
  let n = 0
  if (num(f.price_min) !== null) n++
  if (num(f.price_max) !== null) n++
  if (num(f.beds_min) !== null) n++
  if (num(f.baths_min) !== null) n++
  if (num(f.sqft_min) !== null) n++
  if (f.amenities.length) n++
  if (f.pets.length) n++
  if ((neighborhoodIds || []).length) n++
  if (area) n++
  return n
}

// Filters as the RPC and the saved_searches.filters column store them.
export function filtersForServer(filters) {
  const f = normalizeFilters(filters)
  const out = {}
  const pmin = num(f.price_min), pmax = num(f.price_max)
  const bmin = num(f.beds_min), bath = num(f.baths_min), sq = num(f.sqft_min)
  if (pmin !== null) out.price_min = Math.max(0, Math.round(pmin))
  if (pmax !== null) out.price_max = Math.max(0, Math.round(pmax))
  if (bmin !== null) out.beds_min = bmin
  if (bath !== null) out.baths_min = bath
  if (sq !== null) out.sqft_min = Math.max(0, Math.round(sq))
  if (f.amenities.length) out.amenities = f.amenities
  if (f.pets.length) out.pets = f.pets
  if (f.price_basis === 'net' && f.listing_type !== 'sale' && (pmin !== null || pmax !== null)) out.price_basis = 'net'
  if (f.listing_type === 'sale') out.listing_type = 'sale'
  return out
}

function rpcParams({ filters, neighborhoodIds, area, exclude }) {
  const f = filtersForServer(filters)
  return {
    p_listing_type: f.listing_type === 'sale' ? 'sale' : 'rent',
    p_price_basis: f.price_basis === 'net' ? 'net' : 'gross',
    p_neighborhood_ids: (neighborhoodIds || []).length ? neighborhoodIds : null,
    p_area: area ? JSON.stringify(area) : null,
    p_price_min: f.price_min ?? null,
    p_price_max: f.price_max ?? null,
    p_beds_min: f.beds_min ?? null,
    p_baths_min: f.baths_min ?? null,
    p_sqft_min: f.sqft_min ?? null,
    p_amenities: f.amenities || null,
    p_pets: f.pets || null,
    p_exclude: (exclude || []).length ? exclude : null,
  }
}

// One page of listings. Returns Supabase's { data, error }.
// PostgREST can only ORDER an RPC result by columns that are in the select
// list, so the sort column and id are added to a narrowed `columns`.
export async function searchListings({ filters, neighborhoodIds, area, sort, exclude, page = 0, pageSize = 10, columns = '*' }) {
  const s = SORTS.find(x => x.id === sort) || SORTS[0]
  const from = page * pageSize
  let select = columns
  if (columns !== '*') {
    const cols = columns.split(',').map(c => c.trim()).filter(Boolean)
    for (const c of [s.col, 'id']) if (!cols.includes(c)) cols.push(c)
    select = cols.join(', ')
  }
  return supabase
    .rpc('search_listings', rpcParams({ filters, neighborhoodIds, area, exclude }))
    .select(select)
    .order(s.col, { ascending: s.asc, nullsFirst: false })
    .order('id', { ascending: false })
    .range(from, from + pageSize - 1)
}

// Every matching listing's point, for the map pins (capped). No ORDER BY:
// pins have no order, and ordering an RPC by an unselected column fails.
export async function searchListingPoints({ filters, neighborhoodIds, area, exclude, limit = 500 }) {
  return supabase
    .rpc('search_listings', rpcParams({ filters, neighborhoodIds, area, exclude }))
    .select('id, lat, lng, price, bedrooms, address, neighborhood')
    .not('lat', 'is', null)
    .limit(limit)
}

// Last-used feed state, kept on renter_profiles.search_state.
export async function loadSearchState(userId) {
  const { data, error } = await supabase
    .from('renter_profiles')
    .select('search_state, budget_min, budget_max, bedrooms, sqft_min, neighborhoods')
    .eq('id', userId)
    .maybeSingle()
  if (error) return { state: null, prefs: null, error }
  return { state: data?.search_state || null, prefs: data || null, error: null }
}

export async function saveSearchState(userId, state) {
  return supabase
    .from('renter_profiles')
    .update({ search_state: state })
    .eq('id', userId)
}

// Plain-English summary of a filter set, for saved searches and chips.
export function describeFilters(filters, neighborhoodNames = [], hasArea = false) {
  const f = normalizeFilters(filters)
  const parts = []
  if (f.listing_type === 'sale') parts.push('For sale')
  const pmin = num(f.price_min), pmax = num(f.price_max)
  const basis = f.price_basis === 'net' && f.listing_type !== 'sale' && (pmin !== null || pmax !== null) ? ' net' : ''
  if (pmin !== null && pmax !== null) parts.push(`$${pmin.toLocaleString()}–$${pmax.toLocaleString()}${basis}`)
  else if (pmin !== null) parts.push(`$${pmin.toLocaleString()}+${basis}`)
  else if (pmax !== null) parts.push(`up to $${pmax.toLocaleString()}${basis}`)
  if (num(f.beds_min) !== null) parts.push(num(f.beds_min) === 0 ? 'studio+' : `${f.beds_min}+ bed`)
  if (num(f.baths_min) !== null) parts.push(`${f.baths_min}+ bath`)
  if (num(f.sqft_min) !== null) parts.push(`${num(f.sqft_min).toLocaleString()}+ sqft`)
  if (f.pets.length) parts.push(f.pets.map(p => PETS_OPTIONS.find(o => o.value === p)?.label || p).join(' or '))
  if (f.amenities.length) parts.push(f.amenities.join(', '))
  if (neighborhoodNames.length) {
    parts.push(neighborhoodNames.length <= 3 ? neighborhoodNames.join(', ') : `${neighborhoodNames.slice(0, 2).join(', ')} +${neighborhoodNames.length - 2} more`)
  }
  if (hasArea) parts.push('drawn area')
  if (parts.length === 1 && f.listing_type === 'sale') return 'All homes for sale'
  return parts.length ? parts.join(' · ') : 'All rentals'
}
