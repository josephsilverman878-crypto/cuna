import { supabase } from './supabase'
import { matchListingToNeighborhood } from './neighborhoodAliases'

// Listings for the neighborhoods on the results page.
//
// IMPORTANT — the listings table has NO rent-vs-sale column. Every field on it
// is a rental field (security_deposit, move_in_fee, application_fee,
// available_date) and every price in the table reads as a monthly rent. So every
// listing here is treated as a rental. A buyer therefore has no inventory to
// show, and gets an honest "none yet" instead of rentals dressed up as sales.
// If a sale flag is added later, this is the file that has to learn about it.
//
// FAIR HOUSING: listings are selected by location, price and size only. Nothing
// about the person is used to filter or order them — only the budget ceiling and
// the bedroom count they typed into the quiz.

export const MAX_LISTINGS_PER_NEIGHBORHOOD = 3

// Quiz size answer -> minimum bedrooms. Matches how Feed.jsx treats the renter
// profile: the answer is a floor, not an exact match.
const BEDROOM_MINIMUM = { studio: 0, one_bed: 1, two_bed: 2, three_plus: 3 }

export async function fetchListingsForNeighborhoods(neighborhoodIds = [], answers = {}) {
  const wanted = new Set(neighborhoodIds)
  const grouped = {}
  for (const id of wanted) grouped[id] = []

  // No sale inventory exists, so a buyer gets nothing rather than rentals.
  if (answers.tenure === 'buy') return grouped
  if (wanted.size === 0) return grouped

  let query = supabase
    .from('listings')
    .select('id, address, city, state, neighborhood, zip_code, price, bedrooms, bathrooms, photos')
    .eq('status', 'active')

  // Budget is applied as a ceiling only, the same way the matcher treats it.
  // Filtering out listings below the band would hide cheaper places the renter
  // would happily see. `max: null` means "and up", so there is no ceiling.
  const ceiling = answers.budget?.max
  if (Number.isFinite(ceiling)) query = query.lte('price', ceiling)

  const minBeds = BEDROOM_MINIMUM[answers.size]
  if (Number.isFinite(minBeds) && minBeds > 0) query = query.gte('bedrooms', minBeds)

  // Stable order so the same three previews show on every render.
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })

  if (error) throw new Error(error.message || 'Could not load listings')

  // Neighborhood assignment is client-side: it depends on ZIP and alias rules
  // the database does not know about, so it cannot be pushed into the query.
  for (const listing of data || []) {
    const id = matchListingToNeighborhood(listing)
    if (!id || !wanted.has(id)) continue
    if (grouped[id].length >= MAX_LISTINGS_PER_NEIGHBORHOOD) continue
    grouped[id].push(listing)
  }

  return grouped
}
