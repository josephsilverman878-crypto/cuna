// Listing recommendations (AI phase 5, item 5.1).
//
// The person says what they want. Haiku reads it into the feed's filters
// (the same step as the search box). The server then takes the ACTIVE
// listings on Cuna that match those filters, and Sonnet picks up to five
// and says why each fits. The model sees listings only as rows the server
// built, refers to them by a short code (L1, L2, ...), and every number in
// a reason must be in that listing's row. Thumbs up and down from this
// session are sent along so the next picks can lean toward or away from
// those listings; nothing about them is stored.
//
// This endpoint cannot DO anything: saving a listing, saving a search and
// requesting a tour happen only in the browser, through the existing
// paths, after the person taps a confirmation.
import { z } from 'zod'
import { runAi } from './_ai.js'
import { publicClient } from './_ai-store.js'
import { actionsEnabled } from './_ai-config.js'
import { ungroundedNumber } from './_ai-check.js'
import { readFilters, SEARCH_REFUSAL } from './_ai-search.js'

const COLUMNS = 'id, address, neighborhood, neighborhood_id, listing_type, property_type, price, net_effective_price, bedrooms, bathrooms, sqft, amenities, pets_policy, available_date, months_free, lease_term_months, created_at'
const PETS = { allowed: 'pets allowed', cats_only: 'cats only', none: 'no pets' }
const MAX_ROWS = 30
export const NO_MATCH = 'No active listings on Cuna match that right now. You can save this search and be notified when one is posted.'

const schema = z.object({
  intro: z.string(),
  picks: z.array(z.object({ ref: z.string(), reasons: z.array(z.string()) })),
})

const SYSTEM = `You suggest home listings from Cuna to one person. Use ONLY the LISTINGS table in the message; each line is one real, active listing.

Rules
- Pick up to 5 listings that best fit the CRITERIA. Copy each ref (L1, L2, ...) exactly. Never mention a listing that is not in the table.
- For each pick write 1 to 3 short reasons, each tying a stated criterion to something in that listing's line. Use a number only if it is in that line or in the CRITERIA.
- If the person marked listings they liked or did not like, lean toward listings that share what the liked ones have and away from what the disliked ones have, and say so plainly in a reason ("Like the one you liked, it has a dishwasher").
- Describe the home, never who it suits or who lives nearby. No opinion on the area, no sales language, no advice to rent or buy.
- "intro": one plain sentence on how the picks fit. No greeting.`

function money(n) { return '$' + Math.round(Number(n)).toLocaleString('en-US') }
function ids(v) {
  return (Array.isArray(v) ? v : []).map(String).filter(x => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x)).slice(0, 30)
}

// The same meaning the feed gives each filter. Pure.
export function matches(l, f, hoodIds) {
  const n = (v) => (v === '' || v === undefined || v === null ? null : Number(v))
  if (f.listing_type && (l.listing_type || 'rent') !== f.listing_type) return false
  if (n(f.price_max) != null && Number(l.price) > n(f.price_max)) return false
  if (n(f.price_min) != null && Number(l.price) < n(f.price_min)) return false
  if (n(f.beds_min) != null && Number(l.bedrooms) < n(f.beds_min)) return false
  if (n(f.baths_min) != null && Number(l.bathrooms) < n(f.baths_min)) return false
  if (n(f.sqft_min) != null && !(Number(l.sqft) >= n(f.sqft_min))) return false
  if (f.amenities?.length && !f.amenities.every(a => (l.amenities || []).includes(a))) return false
  if (f.pets?.length) {
    const ok = f.pets.some(p => p === 'cats_only' ? ['allowed', 'cats_only'].includes(l.pets_policy) : l.pets_policy === p)
    if (!ok) return false
  }
  if (hoodIds.length && !hoodIds.includes(l.neighborhood_id)) return false
  return true
}

export function listingLine(ref, l) {
  const sale = l.listing_type === 'sale'
  const parts = [
    `${ref}`,
    sale ? 'for sale' : 'for rent',
    l.neighborhood ? `in ${String(l.neighborhood).slice(0, 60)}` : 'neighborhood not given',
    `${sale ? 'asking' : 'rent'} ${money(l.price)}${sale ? '' : ' a month'}`,
    l.bedrooms === 0 ? 'studio' : `${l.bedrooms} bedroom${Number(l.bedrooms) === 1 ? '' : 's'}`,
    l.bathrooms != null ? `${l.bathrooms} bath${Number(l.bathrooms) === 1 ? '' : 's'}` : null,
    l.sqft ? `${l.sqft} square feet` : null,
    l.property_type ? String(l.property_type).replace('_', ' ') : null,
    Array.isArray(l.amenities) && l.amenities.length ? `amenities: ${l.amenities.join(', ')}` : 'no amenities listed',
    PETS[l.pets_policy] || null,
    l.available_date ? `available ${l.available_date}` : null,
    !sale && Number(l.months_free) > 0 && l.net_effective_price ? `${l.months_free} free month(s), net effective ${money(l.net_effective_price)}` : null,
  ]
  return parts.filter(Boolean).join(' | ')
}

function criteriaLines(p) {
  const f = p.filters
  const out = []
  if (f.listing_type) out.push(f.listing_type === 'sale' ? 'To buy' : 'To rent')
  if (f.price_min) out.push(`At least ${money(f.price_min)}`)
  if (f.price_max) out.push(`Up to ${money(f.price_max)}`)
  if (f.beds_min !== undefined) out.push(f.beds_min === '0' ? 'Studio or larger' : `${f.beds_min} or more bedrooms`)
  if (f.baths_min) out.push(`${f.baths_min} or more baths`)
  if (f.sqft_min) out.push(`${f.sqft_min} or more square feet`)
  if (f.amenities?.length) out.push(`Amenities: ${f.amenities.join(', ')}`)
  if (f.pets?.length) out.push(`Pets: ${f.pets.map(x => PETS[x]).join(', ')}`)
  if (p.matched.length) out.push(`Neighborhoods: ${p.matched.map(m => m.name).join(', ')}`)
  if (p.unsupported.length) out.push(`Also asked for (not in the table, do not guess): ${p.unsupported.join('; ')}`)
  return out
}

export function checkRecs(out, rows, criteriaText) {
  const byRef = new Map(rows.map(r => [r.ref, r]))
  if (!Array.isArray(out.picks) || out.picks.length < 1 || out.picks.length > 5) return 'Pick between 1 and 5 listings from the table.'
  const seen = new Set()
  for (const p of out.picks) {
    const row = byRef.get(p.ref)
    if (!row) return `"${p.ref}" is not a ref in the LISTINGS table. Use only refs from the table.`
    if (seen.has(p.ref)) return 'Each listing may appear once.'
    seen.add(p.ref)
    if (!Array.isArray(p.reasons) || p.reasons.length < 1 || p.reasons.length > 3) return 'Give 1 to 3 reasons for each pick.'
    const text = p.reasons.join(' ')
    if (text.length > 600) return 'Keep each reason to one short sentence.'
    const bad = ungroundedNumber(text.replace(/\bL\d+\b/g, ''), row.line + '\n' + criteriaText)
    if (bad) return `A reason for ${p.ref} uses ${bad}, which is not in its line. Use only numbers from the line or the criteria.`
    if (/\b\d+\s*-?\s*(min|mins|minute|minutes)\b/i.test(text)) return 'Do not state travel times.'
  }
  return null
}

function factualRecs(rows) {
  return {
    intro: 'These active listings match the filters from what you typed.',
    picks: rows.slice(0, 3).map(r => ({ ref: r.ref, reasons: [r.line.split(' | ').slice(1, 6).join(', ') + '.'] })),
  }
}

// body: { text, liked: [listing ids], disliked: [listing ids] }
export async function recommend(ctx, body) {
  const text = String(body.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 400)
  const liked = ids(body.liked), disliked = ids(body.disliked)
  if (text.length < 2) return { ok: true, cached: false, output: { kind: 'message', message: 'Tell me what you are looking for: a price, a size, a neighborhood, amenities.' } }
  const p = await readFilters(ctx, text)
  if (!p.r.ok) return p.r
  const criteria = { filters: p.filters, neighborhoods: p.matched, unmatched_neighborhoods: p.unmatched, sort: p.sort, unsupported: p.unsupported, note: p.offLimits ? SEARCH_REFUSAL : null }
  const actions = actionsEnabled(ctx.env)
  if (p.empty) {
    return { ok: true, cached: false, output: { kind: 'message', message: p.offLimits ? SEARCH_REFUSAL : 'Tell me a price, a size, a neighborhood or an amenity and I will suggest listings.', criteria, actions } }
  }
  const db = ctx.db || publicClient(ctx.env)
  if (!db) return { ok: false, reason: 'error', message: "Cuna's assistant could not answer just now. Please try again in a moment." }
  const { data, error } = await db.from('listings').select(COLUMNS).eq('status', 'active').order('created_at', { ascending: false }).limit(300)
  if (error) return { ok: false, reason: 'error', message: "Cuna's assistant could not answer just now. Please try again in a moment." }
  const all = data || []
  const hoodIds = p.matched.map(m => m.id)
  const fit = all.filter(l => matches(l, p.filters, hoodIds) && !disliked.includes(l.id)).slice(0, MAX_ROWS)
  if (fit.length === 0) return { ok: true, cached: false, output: { kind: 'none', message: NO_MATCH, criteria, actions } }
  const rows = fit.map((l, i) => ({ ref: 'L' + (i + 1), id: l.id, line: listingLine('L' + (i + 1), l) }))
  const short = (l) => listingLine('', l).replace(/^ \| /, '')
  const likedRows = all.filter(l => liked.includes(l.id)).slice(0, 5).map(short)
  const dislikedRows = all.filter(l => disliked.includes(l.id)).slice(0, 5).map(short)
  const criteriaText = criteriaLines(p).join('\n')
  const answer = await runAi(ctx, {
    feature: 'recommend',
    counted: p.r.cached,
    system: SYSTEM,
    user: 'CRITERIA\n' + criteriaText +
      (likedRows.length ? '\n\nLISTINGS THE PERSON LIKED\n' + likedRows.join('\n') : '') +
      (dislikedRows.length ? '\n\nLISTINGS THE PERSON DID NOT LIKE\n' + dislikedRows.join('\n') : '') +
      '\n\nLISTINGS\n' + rows.map(r => r.line).join('\n'),
    schema,
    cacheInput: { criteria: { f: p.filters, h: hoodIds }, liked, disliked, rows: rows.map(r => r.id) },
    dataVersion: rows.map(r => r.id).join(',').slice(0, 200),
    scanText: (o) => [o.intro, ...(o.picks || []).flatMap(x => x.reasons || [])].join(' . '),
    validate: (o) => checkRecs(o, rows, criteriaText),
    fallback: factualRecs(rows),
  })
  if (!answer.ok) return answer
  const byRef = new Map(rows.map(r => [r.ref, r]))
  const items = (answer.output.picks || []).map(x => ({ id: byRef.get(x.ref)?.id, reasons: (x.reasons || []).map(s => String(s).replace(/\bL\d+\b/g, 'this listing').slice(0, 240)) })).filter(x => x.id)
  return {
    ok: true, cached: answer.cached,
    output: { kind: 'listings', intro: String(answer.output.intro || '').slice(0, 400), items, criteria, actions, fallback: Boolean(answer.fallback) },
  }
}
