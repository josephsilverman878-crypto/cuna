// Tests for listing recommendations (api/_ai-recommend.js). Stand-in model
// and database, no network.
//   node --test tests/ai-recommend.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { recommend, matches, listingLine, checkRecs, NO_MATCH } from '../api/_ai-recommend.js'

const reply = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj) }], stop_reason: 'end_turn', usage: { input_tokens: 600, output_tokens: 120 } })
function fakeClient(queue) {
  const calls = []
  const next = async (params) => { calls.push(params); const r = queue.shift(); if (!r) throw new Error('no reply queued'); return r }
  return { calls, messages: { create: next }, beta: { messages: { create: next } } }
}
function fakeStore() {
  const s = { slots: 0, async takeSlot() { s.slots++; return { ok: true, id: s.slots } }, async finish() {}, async log() {}, async cacheGet() { return null }, async cacheSet() {} }
  return s
}
const id = (n) => `00000000-0000-4000-8000-00000000000${n}`
const L = (n, over = {}) => ({ id: id(n), address: `${n} Test St`, neighborhood: 'Astoria', neighborhood_id: 'h-as', listing_type: 'rent', property_type: 'apartment', price: 3000 + n * 100, net_effective_price: null, bedrooms: 2, bathrooms: 1, sqft: 800, amenities: ['Dishwasher'], pets_policy: 'cats_only', available_date: '2026-12-01', months_free: 0, lease_term_months: 12, created_at: '2026-11-1' + n, ...over })
const LISTINGS = [L(1), L(2, { amenities: ['Dishwasher', 'Elevator'] }), L(3, { price: 5200 }), L(4, { neighborhood: 'Park Slope', neighborhood_id: 'h-ps' }), L(5, { listing_type: 'sale', price: 800000 }), L(6, { amenities: [], pets_policy: 'none' })]
const fakeDb = (rows = LISTINGS) => ({ from: () => ({ select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: rows, error: null }) }) }) }) }) })
const HOODS = [{ id: 'h-as', name: 'Astoria' }, { id: 'h-ps', name: 'Park Slope' }]
const ctxOf = (client, store = fakeStore(), extra = {}) => ({ client, store, actor: { kind: 'user', key: 'u:x', userId: 'u1' }, requestId: 'r', env: {}, startedAt: Date.now(), city: { hoods: HOODS }, db: fakeDb(), ...extra })
const PARSED = { listing_type: null, price_min: null, price_max: 4000, beds_min: 2, baths_min: null, sqft_min: null, amenities: ['Dishwasher'], pets: ['cats_only'], neighborhoods: ['Astoria'], sort: null, unsupported: [], off_limits: false }

test('filters mean what they mean in the feed', () => {
  assert.equal(matches(L(1), { price_max: '4000', beds_min: '2', amenities: ['Dishwasher'], pets: ['cats_only'] }, ['h-as']), true)
  assert.equal(matches(LISTINGS[2], { price_max: '4000' }, []), false)
  assert.equal(matches(LISTINGS[5], { amenities: ['Dishwasher'] }, []), false)
  assert.equal(matches(LISTINGS[5], { pets: ['cats_only'] }, []), false)
  assert.equal(matches(L(1, { pets_policy: 'allowed' }), { pets: ['cats_only'] }, []), true)
  assert.equal(matches(LISTINGS[3], {}, ['h-as']), false)
  assert.equal(matches(LISTINGS[4], { listing_type: 'rent' }, []), false)
  assert.match(listingLine('L1', L(1)), /^L1 \| for rent \| in Astoria \| rent \$3,100 a month \| 2 bedrooms \| 1 bath \| 800 square feet/)
})

test('only active listings that match are offered; the picks come back as real ids with grounded reasons', async () => {
  const client = fakeClient([reply(PARSED), reply({ intro: 'Two rentals in Astoria fit a 2-bedroom budget of $4,000 with a dishwasher.', picks: [{ ref: 'L1', reasons: ['Rent is $3,100 a month, under your $4,000 limit.', 'It has a dishwasher and allows cats.'] }, { ref: 'L2', reasons: ['It also has an elevator.'] }] })])
  const store = fakeStore()
  const r = await recommend(ctxOf(client, store), { text: '2 bed under 4k in Astoria with a dishwasher, I have a cat' })
  assert.equal(r.output.kind, 'listings')
  assert.deepEqual(r.output.items.map(i => i.id), [id(1), id(2)])
  assert.equal(store.slots, 1)
  const table = JSON.stringify(client.calls[1].messages)
  assert.equal((table.match(/L\d+ \| for rent/g) || []).length, 2, 'only the two matching listings are in the table')
  assert.equal(/Test St|u1/.test(table), false, 'no address and no account id is sent')
  assert.equal(r.output.actions, false, 'actions are off unless the server flag is on')
  assert.equal((await recommend(ctxOf(fakeClient([reply(PARSED), reply({ intro: 'x', picks: [{ ref: 'L1', reasons: ['It has a dishwasher.'] }] })]), fakeStore(), { env: { AI_ENABLED: 'true', AI_ACTIONS_ENABLED: 'true' } }), { text: 'same thing' })).output.actions, true)
})

test('thumbs from the session are passed on: a disliked listing is left out, liked ones are shown to the model', async () => {
  const client = fakeClient([reply(PARSED), reply({ intro: 'One more that fits.', picks: [{ ref: 'L1', reasons: ['Like the one you liked, it has a dishwasher.'] }] })])
  const r = await recommend(ctxOf(client), { text: '2 bed under 4k in Astoria with a dishwasher, cat', liked: [id(2)], disliked: [id(1)] })
  const msg = JSON.stringify(client.calls[1].messages)
  assert.match(msg, /LISTINGS THE PERSON LIKED/); assert.match(msg, /LISTINGS THE PERSON DID NOT LIKE/)
  assert.deepEqual(r.output.items.map(i => i.id), [id(2)], 'L1 is now the liked listing; the disliked one is not offered')
})

test('nothing matching says so and offers the saved search; an invented listing or number falls back to the plain facts', async () => {
  const none = await recommend(ctxOf(fakeClient([reply({ ...PARSED, price_max: 1000 })])), { text: 'under 1000' })
  assert.equal(none.output.kind, 'none'); assert.equal(none.output.message, NO_MATCH); assert.deepEqual(none.output.criteria.filters.price_max, '1000')
  const bad = { intro: 'x', picks: [{ ref: 'L9', reasons: ['Great.'] }] }
  const r = await recommend(ctxOf(fakeClient([reply(PARSED), reply(bad), reply(bad)])), { text: '2 bed under 4k in Astoria with a dishwasher, cat' })
  assert.equal(r.output.fallback, true); assert.deepEqual(r.output.items.map(i => i.id), [id(1), id(2)])
  const rows = [{ ref: 'L1', id: id(1), line: listingLine('L1', L(1)) }]
  assert.equal(checkRecs({ picks: [{ ref: 'L1', reasons: ['Rent is $3,100 a month.'] }] }, rows, 'Up to $4,000'), null)
  assert.match(checkRecs({ picks: [{ ref: 'L1', reasons: ['Rent is $2,950 a month.'] }] }, rows, 'Up to $4,000'), /\$2,950/)
  assert.match(checkRecs({ picks: [{ ref: 'L1', reasons: ['10 minutes to the train.'] }] }, rows, ''), /10|travel/)
})
