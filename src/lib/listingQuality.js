// Listing quality rules (wave 4, item 4.11). They run on submit of the
// post and edit forms and on every CSV row, for NEW and EDITED listings
// only: nothing here unpublishes a listing that already exists.
//
//   - at least MIN_PHOTOS photos
//   - FARE Act: the fee fields must be filled in for a rental (0 is an
//     answer; blank is not), so every cost the renter pays is disclosed
//   - price within a sane band for the listing type
//   - fair-housing scan of the description (src/lib/fairHousing.js)
//
// validateListing returns [{ tab, message }] where tab is the form tab to
// open (0 details, 1 costs, 2 amenities, 3 photos). Empty means clean.

import { scanDescription } from './fairHousing'

export const MIN_PHOTOS = 3

export const PRICE_BOUNDS = {
  rent: { min: 500, max: 50000, label: '$500 and $50,000 a month' },
  sale: { min: 50000, max: 100000000, label: '$50,000 and $100,000,000' },
}

function filled(v) {
  return v !== null && v !== undefined && String(v).trim() !== ''
}

export function priceProblem(listingType, price) {
  const b = PRICE_BOUNDS[listingType === 'sale' ? 'sale' : 'rent']
  const n = Number(price)
  if (!Number.isFinite(n) || n <= 0) return 'Enter a price.'
  if (n < b.min || n > b.max) return `The price looks wrong: a ${listingType === 'sale' ? 'sale' : 'rental'} on Cuna must be between ${b.label}.`
  return null
}

export function validateListing({ form, photoCount }) {
  const errors = []
  const isSale = form.listing_type === 'sale'

  const p = priceProblem(form.listing_type, form.price)
  if (p) errors.push({ tab: 0, message: p })

  const scan = scanDescription(form.description || '')
  if (scan.blocked.length > 0) {
    errors.push({ tab: 0, message: 'Your description may violate fair housing law. Please remove the highlighted language.' })
  }

  if (!isSale) {
    const missing = [
      ['security_deposit', 'security deposit'],
      ['application_fee', 'application fee'],
      ['move_in_fee', 'move-in fee'],
    ].filter(([k]) => !filled(form[k])).map(([, label]) => label)
    if (missing.length) {
      errors.push({ tab: 1, message: `FARE Act: fill in every fee, even when it is $0 (${missing.join(', ')}).` })
    }
    const bad = ['security_deposit', 'application_fee', 'move_in_fee'].find(k => filled(form[k]) && Number(form[k]) < 0)
    if (bad) errors.push({ tab: 1, message: 'Fees cannot be negative.' })
    const deposit = Number(form.security_deposit)
    if (filled(form.security_deposit) && deposit > Number(form.price)) {
      errors.push({ tab: 1, message: 'New York caps the security deposit at one month’s rent.' })
    }
  }

  if ((photoCount || 0) < MIN_PHOTOS) {
    errors.push({ tab: 3, message: `Add at least ${MIN_PHOTOS} photos (${photoCount || 0} so far).` })
  }

  return errors
}
