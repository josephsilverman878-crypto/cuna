import { supabase } from './supabase'
import { lookupPluto } from './ownerCheck'
import { PUBLIC_STATUSES } from './listingStatus'

// Building pages (/building/:bbl): public facts about one tax lot from
// PLUTO (NYC Open Data 64uk-42ks), the Cuna listings in it, and recorded
// sales through /api/recorded-sales. Nothing about the owner is shown.

const CLASS_LABELS = [
  ['A', 'One-family house'], ['B', 'Two-family house'], ['C', 'Walk-up apartment building'],
  ['D', 'Elevator apartment building'], ['R', 'Condominium'], ['S', 'Mixed-use building with apartments'],
  ['G', 'Garage'], ['H', 'Hotel'], ['K', 'Store building'], ['L', 'Loft building'], ['M', 'Religious building'],
  ['O', 'Office building'], ['V', 'Vacant land'], ['W', 'Educational building'], ['Y', 'Government building'],
]

export function buildingClassLabel(code) {
  const hit = CLASS_LABELS.find(([p]) => String(code || '').toUpperCase().startsWith(p))
  return hit ? hit[1] : (code ? `Building class ${code}` : null)
}

export function isValidBbl(bbl) {
  return /^[1-5][0-9]{9}$/.test(String(bbl || ''))
}

export const BOROUGH_BY_DIGIT = { 1: 'Manhattan', 2: 'Bronx', 3: 'Brooklyn', 4: 'Queens', 5: 'Staten Island' }

// Title-cases PLUTO's upper-case street address ("342 9 STREET" -> "342 9 Street").
export function prettyAddress(a) {
  return String(a || '').toLowerCase().replace(/\b([a-z])/g, c => c.toUpperCase()).replace(/\b(\d+)(St|Nd|Rd|Th)\b/g, (m, n, s) => n + s.toLowerCase())
}

export async function buildingFacts(bbl) {
  const lot = await lookupPluto(bbl)
  if (!lot) return null
  return {
    bbl: String(lot.bbl || bbl).slice(0, 10),
    address: prettyAddress(lot.address),
    borough: BOROUGH_BY_DIGIT[String(bbl)[0]],
    zip: lot.zipcode || null,
    year_built: lot.yearbuilt && Number(lot.yearbuilt) > 0 ? Number(lot.yearbuilt) : null,
    units_res: lot.unitsres ? Number(lot.unitsres) : null,
    units_total: lot.unitstotal ? Number(lot.unitstotal) : null,
    floors: lot.numfloors ? Math.round(Number(lot.numfloors)) : null,
    class_code: lot.bldgclass || null,
    class_label: buildingClassLabel(lot.bldgclass),
  }
}

// Live listings in the building. The public SELECT policy on listings
// returns Active and In-contract rows to anyone.
export async function buildingListings(bbl) {
  return supabase
    .from('listings')
    .select('id, address, price, listing_type, property_type, bedrooms, bathrooms, sqft, status, photos, neighborhood, months_free, lease_term_months')
    .eq('bbl', bbl)
    .in('status', PUBLIC_STATUSES)
    .order('price', { ascending: true })
}
