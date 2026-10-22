import { supabase } from './supabase'

// Open-house slots live in listing_open_houses (34-saved-alerts.sql). Times are
// ENTERED as New York wall-clock times, stored as timestamptz (UTC) and SHOWN
// in New York time, whatever the clock of the computer involved. Cancelling
// sets cancelled_at; nothing is ever deleted.

// Formatting and the New York wall-clock conversion live in ./nyTime (pure,
// importable in plain Node for tests). Re-exported here for callers.
export { formatOpenHouse, openHouseDayTag, isUpcoming, nyWallClockToIso, isoToNyFields } from './nyTime'

// Next upcoming slot per listing id, for feed cards. Only listings the caller
// can read come back (RLS), which is exactly the feed's own set.
export async function getNextOpenHouses(listingIds) {
  if (!listingIds?.length) return {}
  const { data, error } = await supabase
    .from('listing_open_houses')
    .select('listing_id, starts_at, ends_at')
    .in('listing_id', listingIds)
    .is('cancelled_at', null)
    .gt('ends_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
  if (error) { console.error('Open houses fetch failed:', error); return {} }
  const next = {}
  for (const row of data || []) if (!next[row.listing_id]) next[row.listing_id] = row
  return next
}

// Poster side: every slot on one listing, newest first.
export async function getOpenHousesForListing(listingId) {
  return supabase
    .from('listing_open_houses')
    .select('id, starts_at, ends_at, cancelled_at, created_at')
    .eq('listing_id', listingId)
    .order('starts_at', { ascending: false })
}

export async function addOpenHouse(listingId, startsAt, endsAt) {
  return supabase
    .from('listing_open_houses')
    .insert({ listing_id: listingId, starts_at: startsAt, ends_at: endsAt })
    .select('id, starts_at, ends_at, cancelled_at, created_at')
    .single()
}

export async function updateOpenHouse(id, startsAt, endsAt) {
  return supabase
    .from('listing_open_houses')
    .update({ starts_at: startsAt, ends_at: endsAt })
    .eq('id', id)
    .select('id, starts_at, ends_at, cancelled_at, created_at')
    .single()
}

export async function cancelOpenHouse(id) {
  return supabase
    .from('listing_open_houses')
    .update({ cancelled_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, starts_at, ends_at, cancelled_at, created_at')
    .single()
}
