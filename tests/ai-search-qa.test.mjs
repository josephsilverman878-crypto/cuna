// Tests for plain-English search and "Ask about this listing"
// (api/_ai-search.js, api/_ai-listing-qa.js). Stand-in model, no network.
//   node --test tests/ai-search-qa.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { searchParse, matchNeighborhoods, toFilters, SEARCH_REFUSAL } from '../api/_ai-search.js'
import { listingQa, listingFacts, checkAnswer, QA_REFUSAL, QA_UNKNOWN } from '../api/_ai-listing-qa.js'

const reply = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj) }], stop_reason: 'end_turn', usage: { input_tokens: 400, output_tokens: 80 } })
function fakeClient(queue) {
  const calls = []
  const next = async (params) => { calls.push(params); const r = queue.shift(); if (!r) throw new Error('no reply queued'); return r }
  return { calls, messages: { create: next }, beta: { messages: { create: next } } }
}
const fakeStore = () => ({ async takeSlot() { return { ok: true, id: 1 } }, async finish() {}, async log() {}, async cacheGet() { return null }, async cacheSet() {} })
const HOODS = [
  { id: 'h-as', name: 'Astoria' }, { id: 'h-ae', name: 'Astoria (East)-Woodside (North)' },
  { id: 'h-be', name: 'Bushwick (East)' }, { id: 'h-bw', name: 'Bushwick (West)' }, { id: 'h-ps', name: 'Park Slope' },
]
const ctxOf = (client, extra = {}) => ({ client, store: fakeStore(), actor: { kind: 'ip', key: 'ip:x', userId: null }, requestId: 'r', env: {}, startedAt: Date.now(), city: { hoods: HOODS }, ...extra })
const NONE = { listing_type: null, price_min: null, price_max: null, beds_min: null, baths_min: null, sqft_min: null, amenities: [], pets: [], neighborhoods: [], sort: null, unsupported: [], off_limits: false }

test('only what was asked becomes a filter; neighborhoods are matched to Cuna names in code', async () => {
  const client = fakeClient([reply({ ...NONE, price_max: 4000, beds_min: 2, amenities: ['Dishwasher'], pets: ['cats_only'], neighborhoods: ['Astoria', 'Bushwick', 'Narnia'], unsupported: ['near the N train'] })])
  const r = await searchParse(ctxOf(client), { text: '2 bed under 4k in Astoria or Bushwick or Narnia with a dishwasher, I have a cat, near the N train' })
  assert.equal(r.output.kind, 'filters')
  assert.deepEqual(r.output.filters, { price_max: '4000', beds_min: '2', amenities: ['Dishwasher'], pets: ['cats_only'] })
  assert.equal('listing_type' in r.output.filters, false, 'rent or buy is not assumed')
  assert.deepEqual(r.output.neighborhoods.map(n => n.id), ['h-as', 'h-be', 'h-bw'])
  assert.deepEqual(r.output.unmatched_neighborhoods, ['Narnia'])
  assert.deepEqual(r.output.unsupported, ['near the N train'])
  assert.equal(r.output.sort, null)
  assert.equal(client.calls[0].model, 'claude-haiku-5-5')
})

test('filter values are bounded to what the feed offers', () => {
  assert.deepEqual(toFilters({ ...NONE, beds_min: 7, baths_min: 2.5, price_min: 3000, price_max: 3500, sqft_min: 20, listing_type: 'sale' }),
    { listing_type: 'sale', price_min: '3000', price_max: '3500', beds_min: '4', baths_min: '2' })
  assert.deepEqual(toFilters({ ...NONE, beds_min: 0 }), { beds_min: '0' })
  assert.deepEqual(toFilters({ ...NONE, amenities: ['Dishwasher', 'Pool'], pets: ['dogs'] }), { amenities: ['Dishwasher'] })
  assert.deepEqual(matchNeighborhoods(['park slope', 'ASTORIA'], HOODS).matched.map(m => m.id), ['h-ps', 'h-as'])
})

test('a search about who lives somewhere is refused; a mixed one keeps the allowed filters with the note', async () => {
  const only = await searchParse(ctxOf(fakeClient([reply({ ...NONE, off_limits: true })])), { text: 'apartments in a safe white neighborhood' })
  assert.equal(only.output.kind, 'message'); assert.equal(only.output.message, SEARCH_REFUSAL)
  const mixed = await searchParse(ctxOf(fakeClient([reply({ ...NONE, price_max: 3000, off_limits: true })])), { text: 'x under 3000' })
  assert.equal(mixed.output.kind, 'filters'); assert.equal(mixed.output.note, SEARCH_REFUSAL); assert.deepEqual(mixed.output.filters, { price_max: '3000' })
  const nothing = await searchParse(ctxOf(fakeClient([])), { text: ' ' })
  assert.equal(nothing.output.kind, 'message')
})

const LISTING = {
  id: '11111111-2222-4333-8444-555555555555', listing_type: 'rent', status: 'active', address: '31-10 37th Avenue #4B', city: 'Queens', state: 'NY', zip_code: '11101',
  neighborhood: 'Astoria', neighborhood_id: 'h-as', property_type: 'apartment', price: 3200, lease_term_months: 12, months_free: 1, net_effective_price: 2933,
  security_deposit: 3200, application_fee: 20, move_in_fee: null, other_fees: [{ description: 'Amenity fee', amount: 50 }], bedrooms: 2, bathrooms: 1, sqft: 850,
  available_date: '2026-12-01', pets_policy: 'cats_only', amenities: ['Elevator', 'Dishwasher'], days_on_market: 6, lat: 40.76, lng: -73.92, updated_at: '2026-11-10T12:00:00Z',
  description: 'Corner unit facing south. Heat and hot water included.', open_houses: [{ starts_at: '2026-11-21T16:00:00Z', ends_at: '2026-11-21T18:00:00Z' }],
}
const STATIONS = [{ name: '36 Av', routes: ['N', 'W'], distance_m: 320 }]
function fakeDb(listing = LISTING) {
  return {
    rpc: async (name) => name === 'get_listing_public' ? { data: listing, error: null } : { data: STATIONS, error: null },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { name: 'Astoria', borough: 'Queens' }, error: null }) }) }) }),
  }
}

test('listing facts cover price, fees, size, pets, dates and nearby subway, and nothing about the poster', () => {
  const facts = listingFacts(LISTING, { name: 'Astoria', borough: 'Queens' }, STATIONS).join('\n')
  for (const s of ['Monthly rent: $3,200', 'Net effective rent: $2,933 a month', 'Security deposit: $3,200', 'Application fee: $20', 'Other fee: Amenity fee, $50',
    'Broker fee paid by the tenant: none', 'Pets: Cats only', 'Amenities: Elevator, Dishwasher', 'Neighborhood (Cuna boundary): Astoria, Queens',
    'Subway station nearby: 36 Av (N W), 320 meters away, about 5 minutes on foot (estimated)', 'Heat and hot water included']) assert.ok(facts.includes(s), s)
  assert.equal(/poster_id|email|phone/.test(facts), false)
})

test('an answer from the facts is returned; an invented number is redone and then replaced by "I don\'t have that"', async () => {
  const good = fakeClient([reply({ answered: true, answer: 'Cats are allowed; other pets are not. The security deposit is $3,200 and the application fee is $20.' })])
  const a = await listingQa(ctxOf(good, { db: fakeDb() }), { listing_id: LISTING.id, question: 'Are cats ok and what are the fees?' })
  assert.equal(a.output.answered, true); assert.match(a.output.answer, /\$3,200/)
  assert.match(JSON.stringify(good.calls[0].messages), /QUESTION: \\"\\"\\"Are cats ok/)

  const bad = { answered: true, answer: 'The building was built in 1931 and has 6 floors.' }
  const b = await listingQa(ctxOf(fakeClient([reply(bad), reply(bad)]), { db: fakeDb() }), { listing_id: LISTING.id, question: 'When was it built?' })
  assert.equal(b.output.answered, false); assert.equal(b.output.answer, QA_UNKNOWN); assert.equal(b.output.fallback, true)

  const facts = listingFacts(LISTING, null, STATIONS)
  assert.equal(checkAnswer({ answer: 'The 36 Av station (N, W) is about 5 minutes away on foot (estimated).' }, facts), null)
  assert.match(checkAnswer({ answer: 'It is 12 minutes to Midtown.' }, facts), /travel time/)
  assert.match(checkAnswer({ answer: 'The rent is $3,250 a month.' }, facts), /\$3,250/)
  assert.equal(checkAnswer({ answer: 'It is available December 1, 2026 on a 12-month lease.' }, facts), null)
})

test('questions about safety or who lives there get the refusal and the "Ask the agent" path; a bad id never reaches the model', async () => {
  const c = fakeClient([reply({ answered: false, answer: "That's not something I can advise on." })])
  const r = await listingQa(ctxOf(c, { db: fakeDb() }), { listing_id: LISTING.id, question: 'Is this a safe building for a single woman?' })
  assert.equal(r.output.answered, false); assert.equal(r.output.answer, QA_REFUSAL)
  const none = fakeClient([])
  const bad = await listingQa(ctxOf(none, { db: fakeDb() }), { listing_id: 'not-an-id', question: 'Price?' })
  assert.equal(bad.reason, 'not_found'); assert.equal(none.calls.length, 0)
  const missing = await listingQa(ctxOf(none, { db: fakeDb(null) }), { listing_id: LISTING.id, question: 'Price?' })
  assert.equal(missing.reason, 'not_found')
})
