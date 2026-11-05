import { supabase } from './supabase'
import { filtersForServer } from './search'

// Saved searches (public.saved_searches, 42-wave1-search.sql). Own rows only,
// up to 20 per user (database trigger). A new active listing that matches
// one writes a notification (kind 'saved_search') for its owner; the daily
// digest emails those only when SAVED_SEARCH_EMAILS_ENABLED=true.
//
// Shape: { id, name, filters, neighborhood_ids, area_geojson, created_at, updated_at }

const COLUMNS = 'id, name, filters, neighborhood_ids, area_geojson, created_at, updated_at'

export async function listSavedSearches(userId) {
  return supabase
    .from('saved_searches')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export async function createSavedSearch(userId, { name, filters, neighborhoodIds, area }) {
  return supabase
    .from('saved_searches')
    .insert({
      user_id: userId,
      name: String(name || '').trim().slice(0, 80),
      filters: filtersForServer(filters),
      neighborhood_ids: neighborhoodIds || [],
      area_geojson: area || null,
    })
    .select(COLUMNS)
    .single()
}

export async function updateSavedSearch(userId, id, patch) {
  const row = {}
  if (patch.name !== undefined) row.name = String(patch.name || '').trim().slice(0, 80)
  if (patch.filters !== undefined) row.filters = filtersForServer(patch.filters)
  if (patch.neighborhoodIds !== undefined) row.neighborhood_ids = patch.neighborhoodIds || []
  if (patch.area !== undefined) row.area_geojson = patch.area || null
  return supabase
    .from('saved_searches')
    .update(row)
    .eq('id', id)
    .eq('user_id', userId)
    .select(COLUMNS)
    .single()
}

export async function deleteSavedSearch(userId, id) {
  return supabase
    .from('saved_searches')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
}

export async function getSavedSearch(userId, id) {
  return supabase
    .from('saved_searches')
    .select(COLUMNS)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()
}
