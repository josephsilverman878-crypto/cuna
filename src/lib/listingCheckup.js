// Listing checkup (poster assistant): what is missing or weak in a listing
// form before it is posted. Pure and model-free: it reads the form, the
// photo count, the fair-housing scan and Cuna's reference price table, and
// returns a list the Review step shows with one-tap fixes.
//
//   checkupItems({ form, photoCount, neighborhoodName, videoOk, tourOk })
//     -> [{ id, level, title, detail, fixes }]
//   level  'must'   the form will refuse to post until it is fixed
//          'should' worth fixing; posting is still allowed
//   fixes  [{ label, tab }]                 open that step of the form
//          [{ label, set: { field: value } }] fill a field (the poster's tap)
//          [{ label, reword: true }]        ask the assistant to rewrite the
//                                           description without the wording
//
// The "must" items mirror what handleSubmit and src/lib/listingQuality.js
// enforce; nothing here adds a new rule, and nothing here saves anything.
import { scanDescription } from './fairHousing.js'
import { MIN_PHOTOS, priceProblem } from './listingQuality.js'
import { NEIGHBORHOODS as REFERENCE } from './neighborhoods.js'

export const REFERENCE_PERIOD = 'Oct 2025–Sep 2026'

function filled(v) {
  return v !== null && v !== undefined && String(v).trim() !== ''
}
function money(n) {
  return '$' + Math.round(Number(n)).toLocaleString('en-US')
}

// The reference row for a neighborhood name: the same name, or (for areas
// the map splits into parts, such as Bushwick East and West) the reference
// area whose name it starts with. Two boroughs can share a name, so a name
// that matches more than one area is treated as unknown.
export function referenceFor(name, reference = REFERENCE) {
  const n = String(name || '').trim().toLowerCase()
  if (!n) return null
  const exact = reference.filter(r => r.name.toLowerCase() === n)
  if (exact.length === 1) return exact[0]
  if (exact.length > 1) return null
  const starts = reference.filter(r => n.startsWith(r.name.toLowerCase() + ' '))
  return starts.length === 1 ? starts[0] : null
}

// Is the price far from what Cuna has on record for the area? Returns null
// when it is not, or when there is no figure to compare with. "Far" is
// deliberately wide: this is a nudge to re-read the number, not a rule.
export function priceVsArea(form, neighborhoodName, reference = REFERENCE) {
  const price = Number(form.price)
  const ref = referenceFor(neighborhoodName, reference)
  if (!ref || !Number.isFinite(price) || price <= 0) return null
  let range = null, label = '', source = '', lo = 0.6, hi = 1.6, unit = ''
  if (form.listing_type === 'sale') {
    const key = form.property_type === 'condo' ? 'condo' : form.property_type === 'coop' ? 'coop'
      : ['house', 'townhouse', 'multi_family'].includes(form.property_type) ? 'townhouse_multifamily' : null
    range = key ? ref.sale_ranges?.[key] : null
    label = key === 'condo' ? 'condos' : key === 'coop' ? 'co-ops' : '1–3 family houses'
    source = 'NYC Department of Finance recorded sales (middle half of sales)'
    lo = 0.5; hi = 2
  } else {
    const beds = filled(form.bedrooms) ? Number(form.bedrooms) : null
    const key = beds === 0 ? 'studio' : beds === 1 ? 'one_bed' : beds === 2 ? 'two_bed' : null
    range = key ? ref.rent_ranges?.[key] : null
    label = key === 'studio' ? 'studios' : key === 'one_bed' ? 'one-bedrooms' : 'two-bedrooms'
    source = 'StreetEasy published median asking rents (the 12-month median, plus and minus 15%)'
    unit = ' a month'
  }
  if (!range || !Number.isFinite(range.min) || !Number.isFinite(range.max)) return null
  const direction = price < range.min * lo ? 'below' : price > range.max * hi ? 'above' : null
  if (!direction) return null
  return {
    direction, area: ref.name,
    text: `${money(price)}${unit} is well ${direction} the usual range for ${label} in ${ref.name}: ${money(range.min)}–${money(range.max)}${unit}.`,
    source: `Source: ${source}, ${REFERENCE_PERIOD}, for the source's own area named ${ref.name}.`,
  }
}

const FEES = [
  ['security_deposit', 'Security deposit'],
  ['application_fee', 'Application fee'],
  ['move_in_fee', 'Move-in fee'],
]

export function checkupItems({ form, photoCount = 0, neighborhoodName = '', videoOk = true, tourOk = true, reference = REFERENCE }) {
  const items = []
  const sale = form.listing_type === 'sale'
  const add = (id, level, title, detail, fixes) => items.push({ id, level, title, detail, fixes })

  // Photos
  if (photoCount < MIN_PHOTOS) {
    add('photos', 'must', `Add at least ${MIN_PHOTOS} photos`, `${photoCount} so far. The first photo is the cover.`, [{ label: 'Add photos', tab: 3 }])
  }

  // Price
  const p = priceProblem(form.listing_type, form.price)
  if (p) add('price', 'must', 'Check the price', p, [{ label: 'Open Details', tab: 0 }])
  else {
    const far = priceVsArea(form, neighborhoodName, reference)
    if (far) add('price_area', 'should', `The price is well ${far.direction} the usual range`, `${far.text} ${far.source} If the price is right, leave it.`, [{ label: 'Check the price', tab: 0 }])
  }

  // FARE Act fee fields (rentals)
  if (!sale) {
    for (const [key, label] of FEES) {
      if (!filled(form[key])) {
        add('fee_' + key, 'must', `${label} is blank`, 'FARE Act: every fee the tenant pays must be filled in. If there is none, the answer is $0.',
          [{ label: 'There is none: set $0', set: { [key]: '0' } }, { label: 'Open Costs & Fees', tab: 1 }])
      } else if (Number(form[key]) < 0) {
        add('fee_' + key, 'must', `${label} cannot be negative`, 'Enter 0 or more.', [{ label: 'Open Costs & Fees', tab: 1 }])
      }
    }
    const rent = Number(form.price)
    if (filled(form.security_deposit) && rent > 0 && Number(form.security_deposit) > rent) {
      add('deposit_cap', 'must', 'The security deposit is over one month of rent', 'New York caps the security deposit at one month’s rent.',
        [{ label: `Set it to ${money(rent)}`, set: { security_deposit: String(Math.round(rent)) } }, { label: 'Open Costs & Fees', tab: 1 }])
    }
  } else if (!form.property_type) {
    add('property_type', 'must', 'Choose a property type', 'A sale listing needs one: co-op, condo, house, multi-family or townhouse.', [{ label: 'Open Details', tab: 0 }])
  }

  // Pets policy
  if (!form.pets_policy) add('pets', 'must', 'Choose a pets policy', 'Pets allowed, cats only, or no pets.', [{ label: 'Open Amenities', tab: 2 }])

  // Links
  if (!videoOk) add('video', 'must', 'The video link is not a YouTube or Vimeo link', 'Fix the link or clear the box.', [{ label: 'Open Photos', tab: 3 }, { label: 'Clear the link', set: { video_url: '' } }])
  if (!tourOk) add('tour', 'must', 'The 3D tour link is not a Matterport link', 'Fix the link or clear the box.', [{ label: 'Open Photos', tab: 3 }, { label: 'Clear the link', set: { tour_3d_url: '' } }])

  // Wording (src/lib/fairHousing.js)
  const scan = scanDescription(form.description || '')
  if (scan.blocked.length > 0) {
    add('wording_blocked', 'must', 'The description has wording that must be removed',
      scan.blocked.map(h => `“${h.phrase}” (${h.label})`).join(', ') + '. A description is about the home, never about who may live there.',
      [{ label: 'Rewrite without it', reword: true }, { label: 'Edit it myself', tab: 0 }])
  } else if (scan.flagged.length > 0) {
    add('wording_flagged', 'should', 'The description has wording worth a second look',
      scan.flagged.map(h => `“${h.phrase}” (${h.label})`).join(', ') + '.',
      [{ label: 'Rewrite without it', reword: true }, { label: 'Edit it myself', tab: 0 }])
  }

  // Weak, not missing
  if (!filled(form.sqft)) add('sqft', 'should', 'Square footage is missing', 'Add it if you know it. Leave it out if you do not: never estimate.', [{ label: 'Open Details', tab: 0 }])
  if (!String(form.description || '').trim()) {
    add('description', 'should', 'There is no description', 'A few plain sentences about the home. “Draft description” on the Details step writes one from the fields you entered.', [{ label: 'Open Details', tab: 0 }])
  }

  return items
}
