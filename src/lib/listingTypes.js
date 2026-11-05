// Rent vs sale. listings.listing_type is 'rent' (default) or 'sale', fixed
// once the listing exists. For a sale the asking price lives in `price`
// (no "/mo"), and the sale financials replace the rental fees.

export const LISTING_TYPES = [
  { id: 'rent', label: 'Rent', verb: 'For rent' },
  { id: 'sale', label: 'Buy', verb: 'For sale' },
]

export const PROPERTY_TYPES = [
  { value: 'coop', label: 'Co-op' },
  { value: 'condo', label: 'Condo' },
  { value: 'house', label: 'House' },
  { value: 'multi_family', label: 'Multi-family' },
  { value: 'townhouse', label: 'Townhouse' },
]

export function isSale(listing) {
  return listing?.listing_type === 'sale'
}

export function propertyTypeLabel(value) {
  return PROPERTY_TYPES.find(p => p.value === value)?.label || ''
}

export function money(n) {
  const v = Number(n)
  return Number.isFinite(v) ? '$' + v.toLocaleString() : '—'
}

// "$3,200/mo" or "$850,000"
export function priceText(listing) {
  if (!listing) return ''
  return isSale(listing) ? money(listing.price) : money(listing.price) + '/mo'
}

// Short money for map pins: "$3.2k" / "$850k" / "$1.2M"
export function shortMoney(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return ''
  if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1) + 'M'
  if (v >= 10_000) return '$' + Math.round(v / 1000) + 'k'
  if (v >= 1000) return '$' + (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return '$' + v
}

// Monthly cost of owning, from the fields a sale listing carries.
export function monthlyCarrying(listing) {
  if (!isSale(listing)) return null
  const parts = [listing.common_charges, listing.maintenance, listing.monthly_taxes].map(Number).filter(Number.isFinite)
  return parts.length ? parts.reduce((a, b) => a + b, 0) : null
}
