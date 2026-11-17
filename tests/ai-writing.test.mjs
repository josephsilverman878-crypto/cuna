// Tests for the poster's description draft and the neighborhood write-up
// (api/_ai-draft.js, api/_ai-writeup.js). Stand-in model, no network.
//   node --test tests/ai-writing.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildCity } from '../api/_ai-city.js'
import { draft, normalizeFields, factLines, checkDraft, factualDraft, DRAFT_NEED_MORE } from '../api/_ai-draft.js'
import { writeup, checkWriteup, factualWriteup } from '../api/_ai-writeup.js'
import { scanAssistantOutput } from '../src/lib/fairHousing.js'

const reply = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj) }], stop_reason: 'end_turn', usage: { input_tokens: 500, output_tokens: 120 } })
function fakeClient(queue) {
  const calls = []
  const next = async (params) => { calls.push(params); const r = queue.shift(); if (!r) throw new Error('no reply queued'); return r }
  return { calls, messages: { create: next }, beta: { messages: { create: next } } }
}
function fakeStore() {
  const s = { slots: [], async takeSlot({ actor }) { s.slots.push(actor.kind); return { ok: true, id: s.slots.length } }, async finish() {}, async log() {}, async cacheGet() { return null }, async cacheSet() {} }
  return s
}
const FORM = { listing_type: 'rent', property_type: 'apartment', neighborhood: 'Astoria', bedrooms: '2', bathrooms: '1', sqft: '850', price: '3200', available_date: '2026-12-01', lease_term_months: '12', months_free: '', pets_policy: 'cats_only', amenities: ['Elevator', 'Dishwasher', 'Jacuzzi'], address: '31-10 37th Avenue', description: 'old words' }
const GOOD_DRAFT = 'This 2-bedroom, 1-bath apartment in Astoria is offered for rent at $3,200 a month. The home measures 850 square feet. The building has an elevator and the kitchen includes a dishwasher. Cats are allowed. It is available December 1, 2026 on a 12-month lease.'
const ctxOf = (client, store, extra = {}) => ({ client, store, actor: { kind: 'user', key: 'u:x', userId: 'u1', token: 't' }, requestId: 'r', env: {}, startedAt: Date.now(), ...extra })

test('the draft is written from the form fields only: no address, no unknown amenity, no old description', async () => {
  const f = normalizeFields(FORM)
  assert.deepEqual(f.amenities, ['Elevator', 'Dishwasher'])
  const facts = factLines(f).join('\n')
  assert.equal(/37th|31-10|old words|Jacuzzi/.test(facts), false)
  assert.match(facts, /Monthly rent: \$3,200/); assert.match(facts, /Available: December 1, 2026/); assert.match(facts, /Pets: Cats only/)
  const client = fakeClient([reply({ text: GOOD_DRAFT })])
  const r = await draft(ctxOf(client, fakeStore()), { fields: FORM })
  assert.equal(r.output.kind, 'draft'); assert.equal(r.output.text, GOOD_DRAFT); assert.equal(r.output.fallback, false)
  assert.equal(client.calls[0].model, 'claude-sonnet-5-5')
  assert.equal(JSON.stringify(client.calls[0].messages).includes('37th'), false)
})

test('a draft with a number the form does not hold, or wording about who it suits, is redone and then replaced by plain facts', async () => {
  const f = normalizeFields(FORM)
  assert.equal(checkDraft({ text: GOOD_DRAFT }, f), null)
  assert.match(checkDraft({ text: GOOD_DRAFT + ' It is 5 minutes from the N train.' }, f), /number 5/)
  assert.match(checkDraft({ text: 'Nice.' }, f), /too short/)
  assert.match(checkDraft({ text: GOOD_DRAFT + ' Anyone who wants more detail can ask Cuna for the full listing record.' }, f), /closing line/)
  const steering = GOOD_DRAFT + ' Perfect for young professionals in a safe area.'
  const client = fakeClient([reply({ text: steering }), reply({ text: steering })])
  const r = await draft(ctxOf(client, fakeStore()), { fields: FORM })
  assert.equal(client.calls.length, 2); assert.equal(r.output.fallback, true)
  assert.equal(r.output.text, factualDraft(f))
  assert.equal(scanAssistantOutput(r.output.text).ok, true)
  assert.match(r.output.text, /^2-bedroom, 1-bath apartment for rent in Astoria\. 850 square feet\./)
})

test('too little in the form asks for more and makes no model call', async () => {
  const client = fakeClient([])
  const r = await draft(ctxOf(client, fakeStore()), { fields: { listing_type: 'rent', price: '3000' } })
  assert.equal(r.output.message, DRAFT_NEED_MORE); assert.equal(client.calls.length, 0)
})

const square = (lng, lat, d = 0.01) => ({ type: 'MultiPolygon', coordinates: [[[[lng - d, lat - d], [lng + d, lat - d], [lng + d, lat + d], [lng - d, lat + d], [lng - d, lat - d]]]] })
const city = buildCity({
  features: [
    { type: 'Feature', properties: { id: 'id-as', slug: 'astoria', name: 'Astoria', borough: 'Queens', kind: 'neighborhood' }, geometry: square(-73.92, 40.77) },
    { type: 'Feature', properties: { id: 'id-al', slug: 'allerton', name: 'Allerton', borough: 'Bronx', kind: 'neighborhood' }, geometry: square(-73.86, 40.865) },
  ],
  stations: [{ name: 'Astoria Blvd', routes: ['N', 'W'], lat: 40.77, lng: -73.92 }, { name: 'Allerton Av', routes: ['2', '5'], lat: 40.865, lng: -73.86 }],
  listings: [], today: '2026-11-17',
})
const GOOD_WRITEUP = 'Astoria is in Queens, on the East River across from Manhattan. The N and W trains stop inside the neighborhood. Astoria Park sits on the waterfront, and several retail streets run through the area, lined with two- and three-family houses and small apartment buildings. Typical asking rent for a one-bedroom runs from $2,500 to $3,400 a month. Condos have recorded sale prices from $675,000 to $1,075,000.'

test('a write-up is admin-only, grounded in the facts, saved through the admin function, and skips the per-user cap', async () => {
  const saved = []
  const db = { rpc: async (name, args) => { saved.push({ name, args }); return { error: null } } }
  const admin = { city, userClient: () => db }
  const notAdmin = await writeup(ctxOf(fakeClient([]), fakeStore(), admin), { slug: 'astoria' })
  assert.equal(notAdmin.reason, 'forbidden')

  const asAdmin = { ...admin, env: { __admin: true } }
  const store = fakeStore()
  const client = fakeClient([reply({ body: GOOD_WRITEUP })])
  // isAdmin() reads the profile with the user's token; stand in for it here.
  const { writeup: run } = await import('../api/_ai-writeup.js')
  const ctx = ctxOf(client, store, asAdmin)
  ctx.actor = { ...ctx.actor }
  const original = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ is_admin: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  ctx.env = { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon' }
  let r
  try { r = await run(ctx, { slug: 'astoria' }) } finally { globalThis.fetch = original }
  assert.equal(r.ok, true); assert.equal(r.output.saved, true); assert.equal(r.output.body, GOOD_WRITEUP)
  assert.deepEqual(store.slots, ['system'])
  assert.equal(saved[0].name, 'admin_save_writeup'); assert.equal(saved[0].args.p_neighborhood, 'id-as'); assert.equal(saved[0].args.p_model, 'claude-sonnet-5-5')
  assert.ok(saved[0].args.p_sources.every(s => s.source && s.as_of && s.boundary))
  assert.match(JSON.stringify(client.calls[0].messages), /Subway lines with a station inside the neighborhood: N, W/)
})

test('write-up checks: invented numbers are refused; an area with no figures gets a plain, honest fallback', () => {
  const facts = ['Name: Astoria', 'Typical asking rent, one-bedroom: $2,500–$3,400 a month', 'Condos, recorded sale prices: $675,000–$1,075,000']
  assert.equal(checkWriteup({ body: GOOD_WRITEUP }, facts), null)
  assert.match(checkWriteup({ body: GOOD_WRITEUP + ' About 78,000 people live here.' }, facts), /78,000/)
  const plain = factualWriteup(city.bySlug.get('allerton'), city.asOf)
  assert.equal(plain, 'Allerton is in the Bronx. Subway lines with a station inside the neighborhood: 2, 5. Cuna does not hold a price figure for this neighborhood yet.'.replace('the Bronx', 'Bronx'))
  assert.equal(scanAssistantOutput(plain).ok, true)
})
