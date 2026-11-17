// Tests for the neighborhood guide (api/_ai-guide.js, api/_ai-city.js) with
// a made-up city, a stand-in model and a stand-in store: no network.
//   node --test tests/ai-guide.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildCity, figuresFor, milesBetween } from '../api/_ai-city.js'
import { guide, normalizeCriteria, rankCandidates, checkPicks, tidyPlace, REFUSAL, NEED_MORE } from '../api/_ai-guide.js'

const square = (lng, lat, d = 0.01) => ({ type: 'MultiPolygon', coordinates: [[[[lng - d, lat - d], [lng + d, lat - d], [lng + d, lat + d], [lng - d, lat + d], [lng - d, lat - d]]]] })
const feature = (id, slug, name, borough, lng, lat, kind = 'neighborhood') => ({ type: 'Feature', properties: { id, slug, name, borough, kind }, geometry: square(lng, lat) })
const FEATURES = [
  feature('id-ps', 'park-slope', 'Park Slope', 'Brooklyn', -73.98, 40.67),
  feature('id-as', 'astoria', 'Astoria', 'Queens', -73.92, 40.77),
  feature('id-be', 'bushwick-east', 'Bushwick (East)', 'Brooklyn', -73.91, 40.69),
  feature('id-al', 'allerton', 'Allerton', 'Bronx', -73.86, 40.865),
  feature('id-pk', 'prospect-park', 'Prospect Park', 'Brooklyn', -73.969, 40.66, 'park'),
]
const STATIONS = [
  { name: '7 Av', routes: ['F', 'G'], lat: 40.67, lng: -73.98 },
  { name: 'Astoria Blvd', routes: ['N', 'W'], lat: 40.77, lng: -73.92 },
  { name: 'Halsey St', routes: ['L'], lat: 40.69, lng: -73.91 },
  { name: 'Allerton Av', routes: ['2', '5'], lat: 40.865, lng: -73.86 },
  { name: '47-50 Sts', routes: ['B', 'D', 'F', 'M'], lat: 40.7587, lng: -73.9813 },
]
const LISTINGS = [{ neighborhood_id: 'id-as', price: 2800, bedrooms: 1, listing_type: 'rent' }]
const city = buildCity({ features: FEATURES, stations: STATIONS, listings: LISTINGS, today: '2026-11-17' })
const MIDTOWN = { label: 'Rockefeller Center, New York, NY', point: [-73.9787, 40.7587] }

function reply(obj, model) {
  return { content: [{ type: 'text', text: JSON.stringify(obj) }], stop_reason: 'end_turn', usage: { input_tokens: 900, output_tokens: 150 }, model }
}
function fakeClient(queue) {
  const calls = []
  const next = async (params) => { calls.push(params); const r = queue.shift(); if (!r) throw new Error('no reply queued'); return r }
  return { calls, messages: { create: next }, beta: { messages: { create: next } } }
}
function fakeStore() {
  const s = {
    slots: 0, cache: new Map(),
    async takeSlot() { s.slots++; return { ok: true, id: s.slots } },
    async finish() {}, async log() {},
    async cacheGet(h, dv) { const c = s.cache.get(h); return c && c.dataVersion === dv ? c : null },
    async cacheSet(h, v) { s.cache.set(h, { output: v.output, model: v.model, dataVersion: v.dataVersion }) },
  }
  return s
}
const ctxOf = (client, store, extra = {}) => ({
  client, store, actor: { kind: 'ip', key: 'ip:x', userId: null }, requestId: 'r', env: {}, startedAt: Date.now(),
  city, findPlace: async () => MIDTOWN, ...extra,
})
const PARSED = { budget_max: 3600, bedrooms: '1', commute_to: 'Rockefeller Center', boroughs: [], lines: [], wants: ['green_space'], must_haves: ['elevator'], off_limits: false }
const GOOD = {
  intro: 'These three fit a one-bedroom budget of $3,600 and are on lines that reach your destination.',
  picks: [
    { slug: 'astoria', reasons: ['Typical one-bedroom asking rent is inside your budget.', 'The N and W run through the neighborhood.'] },
    { slug: 'park-slope', reasons: ['Prospect Park runs along the eastern edge, which fits the green space you asked for.', 'The F is shared with stations near your destination.'] },
    { slug: 'bushwick-east', reasons: ['The L runs through the neighborhood.', 'The typical one-bedroom range starts under your budget.'] },
  ],
  missing: "I don't have building details such as elevators at the neighborhood level.",
}

test('the city is built from the data: lines by boundary, reference by slug or name, parks left out', () => {
  assert.deepEqual(city.hoods.map(h => h.slug), ['allerton', 'astoria', 'bushwick-east', 'park-slope'])
  assert.deepEqual(city.bySlug.get('park-slope').lines, ['F', 'G'])
  assert.deepEqual(city.bySlug.get('allerton').lines, ['2', '5'])
  assert.equal(city.bySlug.get('park-slope').refArea, 'Park Slope')
  assert.equal(city.bySlug.get('bushwick-east').refArea, 'Bushwick')
  assert.equal(city.bySlug.get('allerton').ref, null)
  assert.equal(city.bySlug.get('astoria').listings.rent.count, 1)
  const more = buildCity({ features: FEATURES, stations: STATIONS, listings: [...LISTINGS, { neighborhood_id: 'id-ps', price: 4000, bedrooms: 1, listing_type: 'rent' }], today: '2026-11-17' })
  assert.notEqual(more.version, city.version, 'a new listing changes the data version')
  assert.ok(milesBetween([-73.98, 40.67], MIDTOWN.point) > 5.5 && milesBetween([-73.98, 40.67], MIDTOWN.point) < 6.7)
})

test('every figure carries a source, an as-of date and whose boundary it is', () => {
  const figs = figuresFor(city.bySlug.get('astoria'), 'rent', '1', city.asOf)
  assert.equal(figs.length, 2)
  for (const f of figs) { assert.ok(f.source); assert.ok(f.as_of); assert.ok(f.boundary); assert.match(f.value, /^\$|^\d/) }
  assert.match(figs[0].boundary, /StreetEasy's area named Astoria/)
  assert.equal(figs[1].boundary, "Cuna's neighborhood boundary")
  assert.equal(figs[1].as_of, '2026-11-17')
  assert.deepEqual(figuresFor(city.bySlug.get('allerton'), 'rent', '1', city.asOf), [])
  assert.ok(figuresFor(city.bySlug.get('park-slope'), 'buy', null, city.asOf).every(f => /Department of Finance/.test(f.source)))
})

test('criteria are bounded, and off-limits wording is dropped and flagged', () => {
  const c = normalizeCriteria({ budget_max: 3600.4, bedrooms: '1', lines: ['f train', 'XX'], boroughs: ['Brooklyn', 'Mars'], wants: ['dining', 'rich'], must_haves: ['elevator', 'a safe area', ''], commute_to: ' Midtown ' }, 'rent')
  assert.equal(c.budget_max, 3600); assert.deepEqual(c.lines, ['F']); assert.deepEqual(c.boroughs, ['Brooklyn'])
  assert.deepEqual(c.wants, ['dining']); assert.deepEqual(c.must_haves, ['elevator']); assert.equal(c.off_limits, true)
  assert.equal(normalizeCriteria({ budget_max: 12 }, 'rent').budget_max, null)
  assert.equal(tidyPlace('GRAND CENTRAL TERMINAL, New York, NY, USA'), 'Grand Central Terminal, New York, NY')
  assert.equal(normalizeCriteria({ budget_max: 900000 }, 'buy').budget_max, 900000)
})

test('ranking uses only stated criteria: a borough filter removes the rest; a low budget pushes pricey areas down', () => {
  const brooklyn = rankCandidates(city, 'rent', normalizeCriteria({ boroughs: ['Brooklyn'] }, 'rent'), null)
  assert.deepEqual(brooklyn.map(r => r.hood.borough), ['Brooklyn', 'Brooklyn'])
  const cheap = rankCandidates(city, 'rent', normalizeCriteria({ budget_max: 2400, bedrooms: '1' }, 'rent'), null)
  assert.equal(cheap[cheap.length - 1].hood.slug, 'park-slope')
})

test('a full request: Haiku reads the criteria, Sonnet picks, and the page figures come from the data', async () => {
  const client = fakeClient([reply(PARSED), reply(GOOD)])
  const store = fakeStore()
  const r = await guide(ctxOf(client, store), { mode: 'rent', text: 'One bedroom under $3,600 near a park, elevator, I work at Rockefeller Center' })
  assert.equal(r.ok, true); assert.equal(r.output.kind, 'picks')
  assert.equal(client.calls.length, 2)
  assert.equal(client.calls[0].model, 'claude-haiku-5-5'); assert.equal(client.calls[1].model, 'claude-sonnet-5-5')
  assert.equal(store.slots, 1, 'one request uses one daily slot')
  assert.equal(JSON.stringify(client.calls[1].messages).includes('I work at'), false, "the person's raw words are not sent to the second call")
  const [a] = r.output.picks
  assert.equal(a.slug, 'astoria'); assert.equal(a.id, 'id-as'); assert.deepEqual(a.lines, ['N', 'W'])
  assert.ok(a.figures.length >= 1 && a.figures.every(f => f.source && f.as_of && f.boundary))
  assert.equal(a.listings_count, 1)
  assert.ok(a.commute.miles > 3 && a.commute.miles < 5)
  assert.deepEqual(r.output.picks[1].commute.shared_lines, ['F'])
  assert.equal(r.output.destination.label, MIDTOWN.label)
  assert.match(r.output.boundary_note, /Cuna's neighborhood boundaries/)
  assert.equal(r.output.note, null)
  // The same request again: both steps come from the cache.
  const again = await guide(ctxOf(client, store), { mode: 'rent', text: 'One bedroom under $3,600 near a park, elevator, I work at Rockefeller Center' })
  assert.equal(again.output.cached, true); assert.equal(client.calls.length, 2); assert.equal(store.slots, 1)
})

test('a neighborhood that is not in the table is refused; after a second bad draft the facts-only picks are shown', async () => {
  const bad = { ...GOOD, picks: [{ slug: 'narnia', reasons: ['It is lovely.'] }, ...GOOD.picks.slice(0, 2)] }
  const client = fakeClient([reply(PARSED), reply(bad), reply(bad)])
  const r = await guide(ctxOf(client, fakeStore()), { mode: 'rent', text: 'x' })
  assert.equal(client.calls.length, 3)
  assert.match(JSON.stringify(client.calls[2].messages), /not a slug in the CANDIDATES table/)
  assert.equal(r.output.fallback, true)
  assert.equal(r.output.picks.length, 3)
  assert.ok(r.output.picks.every(p => city.bySlug.has(p.slug)))
  assert.equal(JSON.stringify(r.output).includes('narnia'), false)
})

test('an invented dollar amount or a travel time in minutes is rejected by the grounding check', () => {
  const c = normalizeCriteria(PARSED, 'rent')
  const rows = rankCandidates(city, 'rent', c, MIDTOWN).map(r => ({ ...r, text: 'slug: ' + r.hood.slug + ' | Typical asking rent, one-bedroom: $2,300–$3,100 a month' }))
  const withPrice = (reason) => ({ ...GOOD, picks: [{ slug: 'astoria', reasons: [reason] }, ...GOOD.picks.slice(1)] })
  assert.equal(checkPicks(GOOD, rows, c), null)
  assert.equal(checkPicks(withPrice('One-bedrooms start at $2,300.'), rows, c), null)
  assert.equal(checkPicks(withPrice('It fits your $3,600 budget.'), rows, c), null)
  assert.match(checkPicks(withPrice('One-bedrooms average $1,950.'), rows, c), /dollar amount/)
  assert.match(checkPicks(withPrice('It is 20 minutes to Midtown.'), rows, c), /minutes/)
  assert.match(checkPicks({ ...GOOD, picks: GOOD.picks.slice(0, 2) }, rows, c), /between 3 and 5/)
})

test('wording that steers is redone once, then replaced by facts-only reasons', async () => {
  const steer = { ...GOOD, picks: [{ slug: 'astoria', reasons: ['A safe area that is good for families.'] }, ...GOOD.picks.slice(1)] }
  const client = fakeClient([reply(PARSED), reply(steer), reply(steer)])
  const r = await guide(ctxOf(client, fakeStore()), { mode: 'rent', text: 'x' })
  assert.equal(r.output.fallback, true)
  assert.equal(/safe|families/i.test(JSON.stringify(r.output.picks)), false)
})

test('a request that is only about who lives somewhere gets the refusal and an offer, with no second model call', async () => {
  const client = fakeClient([reply({ budget_max: null, bedrooms: null, commute_to: null, boroughs: [], lines: [], wants: [], must_haves: [], off_limits: true })])
  const r = await guide(ctxOf(client, fakeStore()), { mode: 'rent', text: 'Where do people like me live?' })
  assert.equal(r.output.kind, 'message'); assert.equal(r.output.message, REFUSAL); assert.equal(client.calls.length, 1)
  const mixed = fakeClient([reply({ ...PARSED, off_limits: true }), reply(GOOD)])
  const m = await guide(ctxOf(mixed, fakeStore()), { mode: 'rent', text: 'x' })
  assert.equal(m.output.kind, 'picks'); assert.equal(m.output.note, REFUSAL)
})

test('boxes only (no free text): no reading step, one model call, one slot; nothing at all asks for more', async () => {
  const client = fakeClient([reply(GOOD)])
  const store = fakeStore()
  const r = await guide(ctxOf(client, store), { mode: 'rent', hints: { budget: '3600', bedrooms: '1', commute: 'Rockefeller Center', must_haves: 'elevator, a safe block' } })
  assert.equal(r.output.kind, 'picks'); assert.equal(client.calls.length, 1); assert.equal(store.slots, 1)
  assert.deepEqual(r.output.criteria.must_haves, ['elevator']); assert.equal(r.output.note, REFUSAL)
  const none = await guide(ctxOf(fakeClient([]), fakeStore()), { mode: 'buy' })
  assert.equal(none.output.message, NEED_MORE)
})

test('a follow-up starts from the earlier criteria and tells the model what was already shown', async () => {
  const client = fakeClient([reply({ ...PARSED, budget_max: 3000 }), reply(GOOD)])
  const r = await guide(ctxOf(client, fakeStore()), { mode: 'rent', followup: 'cheaper, max 3000', previous: { criteria: PARSED, picks: ['astoria', 'park-slope'] } })
  assert.match(JSON.stringify(client.calls[0].messages), /CRITERIA SO FAR/)
  assert.match(JSON.stringify(client.calls[1].messages), /Already shown to the person: astoria, park-slope/)
  assert.equal(r.output.criteria.budget_max, 3000)
})
