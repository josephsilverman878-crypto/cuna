// "Draft description" for posters (AI phase 3, item 3.2).
//
// The browser sends only the fields the poster already typed into the
// listing form (never the street address). Sonnet writes a short
// description from those facts and nothing else. The draft is checked
// before it is returned: every number in it must be one of the form's
// numbers, and it must pass the fair-housing scan. One redo, then a plain
// sentence assembled by code. The form's own fair-housing check still runs
// when the poster saves, whoever wrote the words.
import { z } from 'zod'
import { runAi } from './_ai.js'

const AMENITIES = ['Doorman', 'Elevator', 'Gym', 'Laundry', 'Dishwasher', 'Hardwood floors', 'Roof deck', 'Central air', 'Washer/dryer', 'Parking', 'Storage']
const PETS = { allowed: 'Pets allowed', cats_only: 'Cats only', none: 'No pets' }
const TYPES = { apartment: 'apartment', condo: 'condo', coop: 'co-op', townhouse: 'townhouse', house: 'house', multi_family: 'multi-family house' }
export const DRAFT_NEED_MORE = 'Fill in the bedrooms, price or a few amenities first, and I will draft from those.'

const schema = z.object({ text: z.string() })

const SYSTEM = `You write the description for a home listing in New York City. Use ONLY the FACTS in the message.

Rules
- 60 to 110 words, plain sentences, one paragraph. No headline, no bullet points, no emojis, no exclamation marks.
- Describe the home, never the tenant or buyer: nothing about who it suits or who may apply.
- Do not invent anything that is not in the FACTS: no light, views, layout, finishes, condition, renovation, floor, nearby places, transit or neighborhood character. If the FACTS are few, write fewer words.
- No sales language ("stunning", "must-see", "won't last", "luxury", "dream").
- Use a number only if it appears in the FACTS. Do not mention fees, deposits or broker terms.`

function clean(v, max) {
  return String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}
function num(v, lo, hi) {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null
}

// Whitelisted, bounded copy of what the form sent.
export function normalizeFields(raw) {
  const f = raw && typeof raw === 'object' ? raw : {}
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(f.available_date || '')) ? String(f.available_date) : null
  return {
    listing_type: f.listing_type === 'sale' ? 'sale' : 'rent',
    property_type: TYPES[f.property_type] ? f.property_type : null,
    neighborhood: clean(f.neighborhood, 60) || null,
    bedrooms: num(f.bedrooms, 0, 20),
    bathrooms: num(f.bathrooms, 0, 20),
    sqft: num(f.sqft, 50, 50000),
    price: num(f.price, 100, 500000000),
    available_date: date,
    lease_term_months: num(f.lease_term_months, 1, 60),
    months_free: num(f.months_free, 0, 12),
    pets_policy: PETS[f.pets_policy] ? f.pets_policy : null,
    amenities: [...new Set((Array.isArray(f.amenities) ? f.amenities : []).filter(a => AMENITIES.includes(a)))],
  }
}

function dateWords(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export function factLines(f) {
  const lines = [`Listing: ${f.listing_type === 'sale' ? 'for sale' : 'for rent'}`]
  if (f.property_type) lines.push(`Home type: ${TYPES[f.property_type]}`)
  if (f.neighborhood) lines.push(`Neighborhood: ${f.neighborhood}`)
  if (f.bedrooms != null) lines.push(`Bedrooms: ${f.bedrooms === 0 ? 'studio' : f.bedrooms}`)
  if (f.bathrooms != null) lines.push(`Bathrooms: ${f.bathrooms}`)
  if (f.sqft != null) lines.push(`Size: ${f.sqft} square feet`)
  if (f.price != null) lines.push(`${f.listing_type === 'sale' ? 'Asking price' : 'Monthly rent'}: $${f.price.toLocaleString('en-US')}`)
  if (f.available_date) lines.push(`Available: ${dateWords(f.available_date)}`)
  if (f.listing_type === 'rent' && f.lease_term_months != null) lines.push(`Lease term: ${f.lease_term_months} months`)
  if (f.listing_type === 'rent' && f.months_free) lines.push(`Free months: ${f.months_free}`)
  if (f.amenities.length) lines.push(`Amenities: ${f.amenities.join(', ')}`)
  if (f.pets_policy) lines.push(`Pets: ${PETS[f.pets_policy]}`)
  return lines
}

// A draft may use a number only if the form holds it.
export function checkDraft(out, f) {
  const text = String(out?.text || '')
  if (text.length < 60) return 'The description is too short. Write at least two sentences from the FACTS.'
  if (text.length > 1000) return 'The description is too long. Keep it under 110 words.'
  const allowed = new Set()
  const add = (v) => { if (v != null) { allowed.add(String(v)); allowed.add(String(v).replace(/\.0+$/, '')) } }
  for (const k of ['bedrooms', 'bathrooms', 'sqft', 'price', 'lease_term_months', 'months_free']) add(f[k])
  if (f.available_date) { const [y, m, d] = f.available_date.split('-').map(Number); add(y); add(m); add(d) }
  for (const m of (f.neighborhood || '').matchAll(/\d+/g)) add(m[0])
  for (const m of text.matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
    const n = m[0].replace(/,/g, '').replace(/\.$/, '')
    if (!allowed.has(n) && !allowed.has(String(Number(n)))) return `The description uses the number ${m[0]}, which is not in the FACTS. Use only numbers from the FACTS.`
  }
  return null
}

export function factualDraft(f) {
  const beds = f.bedrooms == null ? '' : f.bedrooms === 0 ? 'Studio' : `${f.bedrooms}-bedroom`
  const baths = f.bathrooms != null ? `${f.bathrooms}-bath` : ''
  const kind = f.property_type ? TYPES[f.property_type] : 'home'
  const head = [beds, baths].filter(Boolean).join(', ')
  const parts = [`${head ? head + ' ' : ''}${kind} for ${f.listing_type === 'sale' ? 'sale' : 'rent'}${f.neighborhood ? ' in ' + f.neighborhood : ''}.`]
  if (f.sqft != null) parts.push(`${f.sqft.toLocaleString('en-US')} square feet.`)
  if (f.amenities.length) parts.push(`Amenities: ${f.amenities.join(', ')}.`)
  if (f.pets_policy) parts.push(`${PETS[f.pets_policy]}.`)
  if (f.available_date) parts.push(`Available ${dateWords(f.available_date)}.`)
  const text = parts.join(' ')
  return text[0].toUpperCase() + text.slice(1)
}

export async function draft(ctx, body) {
  const f = normalizeFields(body.fields)
  const known = [f.bedrooms, f.bathrooms, f.sqft, f.price, f.neighborhood, f.property_type].filter(v => v != null).length + (f.amenities.length ? 1 : 0)
  if (known < 2) return { ok: true, cached: false, output: { kind: 'message', message: DRAFT_NEED_MORE } }
  const r = await runAi(ctx, {
    feature: 'draft',
    system: SYSTEM,
    user: 'FACTS\n' + factLines(f).join('\n'),
    schema,
    scanText: (o) => o.text,
    validate: (o) => checkDraft(o, f),
    fallback: { text: factualDraft(f) },
  })
  if (!r.ok) return r
  return { ok: true, cached: false, output: { kind: 'draft', text: clean(r.output.text, 1000), fallback: Boolean(r.fallback) } }
}
