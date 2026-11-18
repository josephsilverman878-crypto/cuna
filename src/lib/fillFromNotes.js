// "Fill from notes" (poster assistant): turns the assistant's checked answer
// into a patch for the Post listing form. Pure, so it can be tested without
// a browser. Used by src/components/FillFromNotes.jsx.
import { petsPolicyLabel } from './petsPolicy.js'
import { propertyTypeLabel } from './listingTypes.js'

const AMENITY_LABELS = {
  doorman: 'Doorman', elevator: 'Elevator', gym: 'Gym', laundry: 'Laundry in building', dishwasher: 'Dishwasher',
  hardwood: 'Hardwood floors', roof_deck: 'Roof deck', central_air: 'Central air', washer_dryer: 'Washer/dryer in unit',
  parking: 'Parking', storage: 'Storage',
}
const money = (v) => '$' + Number(v).toLocaleString('en-US')
const FIELD_LABELS = {
  listing_type: ['Listing', v => (v === 'sale' ? 'For sale' : 'For rent')],
  property_type: ['Property type', v => propertyTypeLabel(v) || v],
  address: ['Street address', v => v],
  city: ['City', v => v],
  zip_code: ['Zip code', v => v],
  price: ['Price', money],
  bedrooms: ['Bedrooms', v => (String(v) === '0' ? 'Studio' : v)],
  bathrooms: ['Bathrooms', v => v],
  sqft: ['Square footage', v => Number(v).toLocaleString('en-US')],
  available_date: ['Available date', v => v],
  security_deposit: ['Security deposit', money],
  application_fee: ['Application fee', money],
  move_in_fee: ['Move-in fee', money],
  lease_term_months: ['Lease term', v => `${v} months`],
  months_free: ['Free months', v => v],
  pets_policy: ['Pets policy', v => petsPolicyLabel(v) || v],
  common_charges: ['Common charges', v => money(v) + ' a month'],
  maintenance: ['Maintenance', v => money(v) + ' a month'],
  monthly_taxes: ['Taxes', v => money(v) + ' a month'],
  tax_deductible_pct: ['Tax deductible', v => v + '%'],
  financing_allowed_pct: ['Financing allowed', v => v + '%'],
}
// Values the empty form starts with; a field still holding one counts as untouched.
const DEFAULTS = { listing_type: 'rent', lease_term_months: '12' }

// Turns the assistant's answer into { patch, keys, rows, kept }.
//   patch  form fields to set          keys  the fields to outline
//   rows   what to show the poster     kept  labels of fields left as typed
export function buildFill(output, form) {
  const patch = {}, keys = [], rows = [], kept = []
  const untouched = (k) => form[k] === '' || form[k] === null || form[k] === undefined || form[k] === false || form[k] === DEFAULTS[k]
  const put = (key, value, quote) => {
    const [label, show] = FIELD_LABELS[key]
    if (!untouched(key)) { if (String(form[key]) !== String(value)) kept.push(label); return }
    patch[key] = value; keys.push(key); rows.push({ label, value: show(value), quote })
  }
  const by = Object.fromEntries((output.fields || []).map(f => [f.field, f]))
  if (by.street_address) {
    const unit = by.unit?.value
    const unitQuote = by.unit?.quote && !by.street_address.quote.includes(by.unit.quote) ? by.unit.quote : null
    put('address', by.street_address.value + (unit ? ', ' + unit : ''), [by.street_address.quote, unitQuote].filter(Boolean).join(' … '))
  }
  for (const f of output.fields || []) {
    if (f.field === 'street_address' || f.field === 'unit' || !FIELD_LABELS[f.field]) continue
    put(f.field, f.value, f.quote)
  }
  for (const a of output.amenities || []) {
    if (!AMENITY_LABELS[a.key] || form[a.key]) continue
    patch[a.key] = true; keys.push(a.key); rows.push({ label: 'Amenity', value: AMENITY_LABELS[a.key], quote: a.quote })
  }
  const fees = (output.other_fees || []).filter(f => !(form.other_fees || []).some(x => x.description === f.description))
  if (fees.length) {
    patch.other_fees = [...(form.other_fees || []), ...fees.map(f => ({ description: f.description, amount: f.amount }))]
    keys.push('other_fees')
    for (const f of fees) rows.push({ label: 'Other fee', value: `${f.description}: ${money(f.amount)}`, quote: f.quote })
  }
  return { patch, keys, rows, kept }
}
