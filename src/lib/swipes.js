import { supabase } from './supabase'

// Every read and write to the `swipes` table goes through this file.
//
// UNIQUE(renter_id, listing_id) means one row per renter per listing. `liked` and
// `hidden` are independent flags, and each function here touches only its own.
// Leaving the other flag out of the upsert payload is what preserves it, so never
// "complete" a payload by adding the other flag. `direction` is dead: never read
// or write it.
//
// Every function returns Supabase's { data, error } unchanged. Callers own the
// error handling, toasts, and state updates.

// All of a renter's swipe rows. Pass `orderBy` to sort; with no `orderBy` the
// query has no ORDER BY at all, matching the unordered reads that need it.
export async function getMySwipes(renterId, columns = '*', { orderBy, ascending = true } = {}) {
  let query = supabase
    .from('swipes')
    .select(columns)
    .eq('renter_id', renterId)

  if (orderBy) query = query.order(orderBy, { ascending })

  return query
}

// The renter's row for one listing, or null data if there isn't one.
export async function getMySwipe(renterId, listingId) {
  return supabase
    .from('swipes')
    .select('id, liked')
    .eq('renter_id', renterId)
    .eq('listing_id', listingId)
    .maybeSingle()
}

// `hidden` is deliberately absent from the payload, so liking never disturbs a hide.
export async function setLiked(renterId, listingId, value) {
  return supabase
    .from('swipes')
    .upsert({
      renter_id: renterId,
      listing_id: listingId,
      liked: value,
    }, { onConflict: 'renter_id,listing_id' })
}

// `liked` is deliberately absent from the payload, so hiding never unsaves.
export async function setHidden(renterId, listingId, value) {
  return supabase
    .from('swipes')
    .upsert({
      renter_id: renterId,
      listing_id: listingId,
      hidden: value,
    }, { onConflict: 'renter_id,listing_id' })
}

// Deletes the row outright, which clears both flags.
export async function removeSwipe(renterId, listingId) {
  return supabase
    .from('swipes')
    .delete()
    .eq('renter_id', renterId)
    .eq('listing_id', listingId)
}

// The ONE place poster-side swipe access happens. Posters are meant to see
// aggregate interest only, never who saved, so this selects listing_id and nothing
// else, and the caller does the counting. This is where the planned RLS/RPC fix
// goes: replace this row read with an RPC that returns per-listing counts and
// never exposes renter_id, then lock posters out of reading swipes rows directly.
export async function getSaveCounts(listingIds) {
  return supabase
    .from('swipes')
    .select('listing_id')
    .in('listing_id', listingIds)
    .eq('liked', true)
}
