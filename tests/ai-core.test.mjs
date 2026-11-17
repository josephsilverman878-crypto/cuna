// Tests for the shared AI pipeline (api/_ai.js) with a stand-in model and a
// stand-in store: no network, no API key, no database.
//   node --test tests/ai-core.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { z } from 'zod'
import { runAi, collectStrings } from '../api/_ai.js'
import { estimateCost, limits, featureAllowed, aiEnabled, LIMIT_MESSAGES } from '../api/_ai-config.js'
import { getStore, identify, stableJson, sha256 } from '../api/_ai-store.js'
import { scanAssistantOutput } from '../src/lib/fairHousing.js'

const Schema = z.object({ answer: z.string() })

function reply(obj, { stop = 'end_turn', usage = { input_tokens: 1000, output_tokens: 200 }, model } = {}) {
  return { content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: typeof obj === 'string' ? obj : JSON.stringify(obj) }], stop_reason: stop, usage, model }
}

function fakeClient(queue) {
  const calls = []
  const next = async (params) => {
    calls.push(params)
    const r = queue.shift()
    if (r instanceof Error) throw r
    return r
  }
  return { calls, messages: { create: next }, beta: { messages: { create: next } } }
}

function fakeStore({ cap = 3 } = {}) {
  const s = {
    kind: 'fake', slots: 0, finished: [], logged: [], cache: new Map(), cacheWrites: 0,
    async takeSlot() { if (s.slots >= cap) return { ok: false, reason: 'user' }; s.slots++; return { ok: true, id: s.slots } },
    async finish(id, fields) { s.finished.push({ id, ...fields }) },
    async log(row) { s.logged.push(row) },
    async cacheGet(hash, dv) { const c = s.cache.get(hash); return c && c.dataVersion === dv ? c : null },
    async cacheSet(hash, v) { s.cacheWrites++; s.cache.set(hash, { output: v.output, model: v.model, dataVersion: v.dataVersion }) },
  }
  return s
}

const actor = { kind: 'user', key: 'u1', userId: '00000000-0000-4000-8000-000000000001' }
const ctxOf = (client, store) => ({ client, store, actor, requestId: 'r1', env: {}, startedAt: Date.now() })
const spec = (over = {}) => ({
  feature: 'guide', system: 'sys', user: 'DATA: Park Slope, F G trains.', schema: Schema,
  cacheInput: { q: 'near the F train' }, dataVersion: 'v1', fallback: { answer: 'neutral' }, ...over,
})

test('a clean answer is returned, logged without content, and cached', async () => {
  const client = fakeClient([reply({ answer: 'Park Slope has the F and G trains.' })])
  const store = fakeStore()
  const r = await runAi(ctxOf(client, store), spec())
  assert.equal(r.ok, true); assert.equal(r.cached, false)
  assert.equal(r.output.answer, 'Park Slope has the F and G trains.')
  assert.equal(client.calls.length, 1)
  assert.equal(client.calls[0].model, 'claude-sonnet-5-5')
  assert.equal(client.calls[0].fallbacks, 'default')
  assert.equal(client.calls[0].output_config.effort, 'low')
  assert.equal(client.calls[0].thinking, undefined)
  assert.equal(client.calls[0].temperature, undefined)
  const row = store.finished[0]
  assert.equal(row.status, 'ok'); assert.equal(row.input_tokens, 1000); assert.equal(row.output_tokens, 200)
  assert.ok(Math.abs(row.cost_usd - 0.004) < 1e-9)
  assert.equal(JSON.stringify(row).includes('Park Slope'), false, 'usage row must not contain the answer')
  assert.equal(JSON.stringify(row).includes('near the F'), false, 'usage row must not contain the question')
  assert.equal(store.cacheWrites, 1)
})

test('an identical request with the same data version is served from the cache with no model call', async () => {
  const client = fakeClient([reply({ answer: 'first' })])
  const store = fakeStore()
  await runAi(ctxOf(client, store), spec())
  const r2 = await runAi(ctxOf(client, store), spec())
  assert.equal(r2.cached, true); assert.equal(r2.output.answer, 'first')
  assert.equal(client.calls.length, 1)
  assert.equal(store.slots, 1, 'a cache hit does not use a daily slot')
  assert.equal(store.logged[0].cache_hit, true)
})

test('a changed data version misses the cache', async () => {
  const client = fakeClient([reply({ answer: 'first' }), reply({ answer: 'second' })])
  const store = fakeStore()
  await runAi(ctxOf(client, store), spec())
  const r2 = await runAi(ctxOf(client, store), spec({ dataVersion: 'v2' }))
  assert.equal(r2.cached, false); assert.equal(r2.output.answer, 'second')
})

test('a reached cap returns a friendly message and makes no model call', async () => {
  const client = fakeClient([])
  const store = fakeStore({ cap: 0 })
  const r = await runAi(ctxOf(client, store), spec())
  assert.equal(r.ok, false); assert.equal(r.reason, 'limit'); assert.equal(r.message, LIMIT_MESSAGES.user)
  assert.equal(client.calls.length, 0)
})

test('steering language is regenerated once, then accepted when clean', async () => {
  const client = fakeClient([reply({ answer: 'A safe, family-friendly area.' }), reply({ answer: 'It has the F and G trains.' })])
  const store = fakeStore()
  const r = await runAi(ctxOf(client, store), spec())
  assert.equal(r.output.answer, 'It has the F and G trains.')
  assert.equal(client.calls.length, 2)
  assert.match(client.calls[1].messages[0].content, /rejected because it used wording that is not allowed/)
  assert.equal(store.finished[0].fh_regenerations, 1); assert.equal(store.finished[0].fh_fallback, false)
  assert.equal(store.finished[0].input_tokens, 2000, 'both calls are counted in the cost')
})

test('steering language twice falls back to the neutral answer and is not cached', async () => {
  const client = fakeClient([reply({ answer: 'Very safe.' }), reply({ answer: 'An up-and-coming area.' })])
  const store = fakeStore()
  const r = await runAi(ctxOf(client, store), spec())
  assert.equal(r.ok, true); assert.equal(r.fallback, true); assert.equal(r.output.answer, 'neutral')
  assert.equal(store.finished[0].status, 'fallback'); assert.equal(store.finished[0].fh_fallback, true)
  assert.equal(store.cacheWrites, 0)
})

test('an ungrounded answer is regenerated with the correction note', async () => {
  const client = fakeClient([reply({ answer: 'Try Narnia Heights.' }), reply({ answer: 'Try Park Slope.' })])
  const store = fakeStore()
  const r = await runAi(ctxOf(client, store), spec({ validate: (o) => (o.answer.includes('Narnia') ? 'Narnia Heights is not in the data.' : null) }))
  assert.equal(r.output.answer, 'Try Park Slope.')
  assert.match(client.calls[1].messages[0].content, /Narnia Heights is not in the data/)
})

test('a model refusal returns the neutral answer', async () => {
  const client = fakeClient([reply('', { stop: 'refusal' })])
  const store = fakeStore()
  const r = await runAi(ctxOf(client, store), spec())
  assert.equal(r.ok, true); assert.equal(r.output.answer, 'neutral'); assert.equal(store.finished[0].status, 'refused')
})

test('a model error is reported as a friendly failure and logged with a code only', async () => {
  const client = fakeClient([Object.assign(new Error('boom: secret detail'), { code: 'ECONNRESET' })])
  const store = fakeStore()
  const r = await runAi(ctxOf(client, store), spec())
  assert.equal(r.ok, false); assert.equal(r.reason, 'error')
  assert.equal(store.finished[0].status, 'error'); assert.equal(store.finished[0].error_code, 'ECONNRESET')
  assert.equal(JSON.stringify(store.finished[0]).includes('secret detail'), false)
})

test('the fast tier uses Haiku without the fallback parameter', async () => {
  const client = fakeClient([reply({ answer: 'ok' })])
  await runAi(ctxOf(client, fakeStore()), spec({ feature: 'listing_qa' }))
  assert.equal(client.calls[0].model, 'claude-haiku-5-5')
  assert.equal(client.calls[0].fallbacks, undefined)
})

test('web search is added only when the server flag is on, and such answers are not cached', async () => {
  const off = fakeClient([reply('plain text')])
  await runAi(ctxOf(off, fakeStore()), spec({ schema: null, webSearch: true, fallback: 'neutral' }))
  assert.equal(off.calls[0].tools, undefined)
  const on = fakeClient([reply('plain text')])
  const store = fakeStore()
  const ctx = { ...ctxOf(on, store), env: { AI_WEB_SEARCH_ENABLED: 'true' } }
  await runAi(ctx, spec({ schema: null, webSearch: true, fallback: 'neutral' }))
  assert.equal(on.calls[0].tools[0].name, 'web_search')
  assert.equal(on.calls[0].tools.some(t => t.name === 'web_fetch'), false, 'the assistant never fetches pages itself')
  assert.equal(store.cacheWrites, 0)
})

test('cost estimate uses the price table', () => {
  assert.ok(Math.abs(estimateCost('claude-haiku-5-5', { input_tokens: 1_000_000, output_tokens: 1_000_000 }) - 0.6) < 1e-9)
  assert.ok(Math.abs(estimateCost('claude-sonnet-5-5', { input_tokens: 1_000_000, output_tokens: 1_000_000, cache_read_input_tokens: 1_000_000 }) - 12.1) < 1e-9)
})

test('limits, kill switch and feature allowlist read the environment', () => {
  assert.deepEqual(limits({}), { userPerDay: 30, ipPerDay: 10, globalPerDay: 500 })
  assert.equal(limits({ AI_DAILY_REQUEST_CAP: '40' }).globalPerDay, 40)
  assert.equal(aiEnabled({}), false); assert.equal(aiEnabled({ AI_ENABLED: 'true' }), true)
  assert.equal(featureAllowed('guide', {}), true)
  assert.equal(featureAllowed('guide_parse', { AI_FEATURES: 'guide' }), true)
  assert.equal(featureAllowed('listing_qa', { AI_FEATURES: 'guide' }), false)
})

test('production without the service-role key has no store; previews get in-memory limits', async () => {
  assert.equal(getStore({ VERCEL_ENV: 'production' }), null)
  const store = getStore({ VERCEL_ENV: 'preview' })
  assert.equal(store.kind, 'memory')
  const ip = { kind: 'ip', key: 'ip:test-' + Math.random(), userId: null }
  let allowed = 0
  for (let i = 0; i < 12; i++) { const s = await store.takeSlot({ actor: ip }); if (s.ok) allowed++ }
  assert.equal(allowed, 10, 'logged-out visitors get 10 a day')
})

test('a logged-out visitor is identified by a keyed hash, never the raw IP', async () => {
  const a = await identify({ headers: { 'x-real-ip': '203.0.113.7' } }, {})
  assert.equal(a.kind, 'ip'); assert.equal(a.key.includes('203.0.113.7'), false); assert.match(a.key, /^ip:[0-9a-f]{40}$/)
  const b = await identify({ headers: { 'x-real-ip': '203.0.113.8' } }, {})
  assert.notEqual(a.key, b.key)
})

test('helpers', () => {
  assert.equal(stableJson({ b: 1, a: [2, { d: 1, c: 2 }] }), '{"a":[2,{"c":2,"d":1}],"b":1}')
  assert.equal(sha256('x').length, 64)
  assert.equal(collectStrings({ a: 'one', b: ['two', { c: 'three' }], n: 4 }), 'one\ntwo\nthree')
  assert.equal(scanAssistantOutput("That's not something I can advise on. I can help with price, size, commute, transit and amenities.").ok, true)
})
