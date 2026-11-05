import { supabase } from './supabase'

// Listing statistics for posters (46-wave4-broker-tools.sql).
//
// Views are counted once per anonymous browser session per New York day by
// record_listing_view(): the session key below is a random string kept in
// localStorage, never a user id, so the database can dedupe without knowing
// who looked. listing_stats() and listing_views_daily() are SECURITY DEFINER
// and return rows for the calling poster's own listings only.

const SESSION_KEY = 'cuna:view-session'

function sessionKey() {
  try {
    let k = localStorage.getItem(SESSION_KEY)
    if (!k || k.length < 16) {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      k = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
      localStorage.setItem(SESSION_KEY, k)
    }
    return k
  } catch {
    // Storage blocked (private mode): a per-page key still counts the view once.
    return 'ephemeral-' + Math.random().toString(16).slice(2).padEnd(24, '0')
  }
}

// Fire-and-forget. Never called for the listing's own poster.
export function recordView(listingId) {
  return supabase.rpc('record_listing_view', { p_listing: listingId, p_session: sessionKey() })
}

// [{ listing_id, views_total, views_7d, views_30d, saves, inquiries, inquiries_new }]
export async function listingStats(listingIds = null) {
  return supabase.rpc('listing_stats', { p_listing_ids: listingIds })
}

// [{ day, views }] for the last `days` New York days, own listings only.
export async function listingViewsDaily(listingId, days = 30) {
  return supabase.rpc('listing_views_daily', { p_listing: listingId, p_days: days })
}
