import { supabase } from './supabase'

// Open-house slots live in listing_open_houses (34-saved-alerts.sql). Times are
// stored as timestamptz and SHOWN in New York time whatever the viewer's clock.
// Cancelling sets cancelled_at; nothing is ever deleted.

const TZ = 'America/New_York'

// "Sat, Oct 24 · 12:00–1:30 PM"
export function formatOpenHouse(startsAt, endsAt) {
  const s = new Date(startsAt), e = new Date(endsAt)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return ''
  const day = s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: TZ })
  const t1 = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ })
  const t2 = e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ })
  const samePeriod = t1.slice(-2) === t2.slice(-2)
  return `${day} · ${samePeriod ? t1.slice(0, -3) : t1}–${t2}`
}

// "Open house Sat"
export function openHouseDayTag(startsAt) {
  const s = new Date(startsAt)
  if (Number.isNaN(s.getTime())) return ''
  return `Open house ${s.toLocaleDateString('en-US', { weekday: 'short', timeZone: TZ })}`
}

export function isUpcoming(slot) {
  return slot && !slot.cancelled_at && new Date(slot.ends_at).getTime() > Date.now()
}

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
