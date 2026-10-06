import { supabase } from './supabase'

// Poster contact details used to live on an embedded join:
//   .select('*, profiles(name, email, phone)')
// That embed resolves through the foreign key listings.poster_id -> profiles.id,
// and it only worked because every signed-in user could read all of `profiles`.
// Stage 2c removes that blanket read.
//
// `listing_poster_contacts` is the replacement: a view exposing exactly
// poster_id, name, email and phone, and only for posters with at least one
// ACTIVE listing. A view is not a foreign-key target, so it cannot be embedded.
// Hence one extra query, joined here, on every page that needs it.
//
// The result is attached under the `profiles` key so that callers — notably
// RequestTour, which reads listing.profiles?.email — keep working unchanged.
//
// A listing whose poster is not in the view gets `profiles: null`. That is the
// expected state for a paused or delisted listing, and callers must handle it
// rather than assume a poster is always present.

export async function attachPosterContacts(listings) {
  if (!Array.isArray(listings) || listings.length === 0) return listings || []

  const posterIds = [...new Set(listings.map(l => l.poster_id).filter(Boolean))]
  if (posterIds.length === 0) return listings.map(l => ({ ...l, profiles: null }))

  // This function must never throw and never return fewer listings than it was
  // given. The listings are the page; contact details are an enhancement. A
  // failure here degrades the tour button, it does not blank the page.
  // The try/catch covers a rejected fetch (offline, DNS, CORS), which arrives as
  // an exception rather than in `error`.
  try {
    const { data, error } = await supabase
      .from('listing_poster_contacts')
      .select('poster_id, name, email, phone')
      .in('poster_id', posterIds)

    if (error) {
      console.error('Poster contacts fetch failed:', error)
      return listings.map(l => ({ ...l, profiles: null }))
    }

    const byPoster = new Map(
      (data || []).map(p => [p.poster_id, { name: p.name, email: p.email, phone: p.phone }])
    )

    return listings.map(l => ({ ...l, profiles: byPoster.get(l.poster_id) || null }))
  } catch (err) {
    console.error('Poster contacts fetch threw:', err)
    return listings.map(l => ({ ...l, profiles: null }))
  }
}

// True when we have enough to send a tour request. api/send-inquiry.js requires
// posterEmail and returns 400 without it, so the UI checks before offering.
export function hasPosterContact(listing) {
  return Boolean(listing?.profiles?.email)
}
