// Tests for the shared AI pipeline (api/_ai.js) with a stand-in model and a
// stand-in store: no network, no API key, no database.
//   node --test tests/ai-core.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { z } from 'zod'
import { runAi, collectStrings } from '../api/_ai.js'
import { estimateCost, searchCost, allowance, capFor, usageView, featureAllowed, aiEnabled, LIMIT_MESSAGES } from '../api/_ai-config.js'
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
    async takeSlot() { if (s.slots >= cap) return { ok: false, reason: 'user', spent: 0.5, global: 1 }; s.slots++; return { ok: true, id: s.slots, spent: 0, global: 0 } },
    async spent() { return { actor: 0, global: 0 } },
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

test('a used-up allowance returns the friendly message and makes no model call', async () => {
  const client = fakeClient([])
  const store = fakeStore({ cap: 0 })
  const r = await runAi(ctxOf(client, store), spec())
  assert.equal(r.ok, false); assert.equal(r.reason, 'limit'); assert.equal(r.message, LIMIT_MESSAGES.user)
  assert.match(r.message, /^You've used today's AI\. It resets at midnight\./)
  assert.doesNotMatch(Object.values(LIMIT_MESSAGES).join(' '), /\$|dollar|cent/i, 'people never see an amount')
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

test('a web answer keeps only the cited pages, counts its searches in the cost, and drops the preamble', async () => {
  const cite = (url, title) => ({ type: 'web_search_result_location', url, title, cited_text: 'x', encrypted_index: 'e' })
  const response = {
    content: [
      { type: 'text', text: 'Let me look that up.' },
      { type: 'server_tool_use', id: 's1', name: 'web_search', input: { query: 'q' } },
      { type: 'web_search_tool_result', tool_use_id: 's1', content: [
        { type: 'web_search_result', url: 'https://www.nyc.gov/a', title: 'NYC', encrypted_content: 'zzz' },
        { type: 'web_search_result', url: 'https://example.com/not-cited', title: 'Other', encrypted_content: 'zzz' },
      ] },
      { type: 'text', text: 'According to the city, the building dates from 1931.', citations: [cite('https://www.nyc.gov/a', 'NYC'), cite('https://www.nyc.gov/a', 'NYC')] },
      { type: 'text', text: ' It has six floors.', citations: [cite('javascript:alert(1)', 'bad')] },
    ],
    stop_reason: 'end_turn',
    usage: { input_tokens: 10000, output_tokens: 100, server_tool_use: { web_search_requests: 2 } },
  }
  const client = fakeClient([response])
  const store = fakeStore()
  let seen = null
  const r = await runAi({ ...ctxOf(client, store), env: { AI_WEB_SEARCH_ENABLED: 'true' } },
    spec({ feature: 'listing_web', schema: null, webSearch: true, cacheInput: null, fallback: 'neutral', validate: (out, extra) => { seen = extra.sources; return null } }))
  assert.equal(r.ok, true)
  assert.equal(r.output, 'According to the city, the building dates from 1931. It has six floors.')
  assert.deepEqual(r.sources, [{ url: 'https://www.nyc.gov/a', title: 'NYC' }], 'only the cited page, once, and only http links')
  assert.deepEqual(seen, r.sources, 'the grounding check is told which pages were cited')
  const row = store.finished[0]
  assert.equal(row.web_searches, 2)
  assert.ok(Math.abs(row.search_cost_usd - 0.02) < 1e-9)
  assert.ok(Math.abs(row.cost_usd - (0.001 + 0.00005 + 0.02)) < 1e-9, 'tokens plus searches')
  assert.equal(JSON.stringify(store.finished).includes('nyc.gov'), false, 'no web content or link is logged')
})

test('cost estimate uses the price table', () => {
  assert.ok(Math.abs(estimateCost('claude-haiku-5-5', { input_tokens: 1_000_000, output_tokens: 1_000_000 }) - 0.6) < 1e-9)
  assert.ok(Math.abs(estimateCost('claude-sonnet-5-5', { input_tokens: 1_000_000, output_tokens: 1_000_000, cache_read_input_tokens: 1_000_000 }) - 12.1) < 1e-9)
  assert.ok(Math.abs(searchCost({ web_search_requests: 3 }) - 0.03) < 1e-9)
  assert.ok(Math.abs(estimateCost('claude-haiku-5-5', { input_tokens: 1_000_000, web_search_requests: 1 }) - 0.11) < 1e-9, 'a search is part of the cost')
})

test('the allowance, kill switch and feature allowlist read the environment', () => {
  assert.deepEqual(allowance({}), { user: 0.5, visitor: 0.1, global: 5, reserve: 0.03 })
  const env = { AI_USER_DAILY_ALLOWANCE: '1.25', AI_VISITOR_DAILY_ALLOWANCE: '0.2', AI_DAILY_COST_CAP: '12' }
  assert.deepEqual(allowance(env), { user: 1.25, visitor: 0.2, global: 12, reserve: 0.03 })
  assert.equal(allowance({ AI_DAILY_COST_CAP: 'lots' }).global, 5, 'a bad value falls back to the default')
  assert.equal(capFor({ kind: 'user' }, {}), 0.5); assert.equal(capFor({ kind: 'ip' }, {}), 0.1); assert.equal(capFor({ kind: 'system' }, {}), null)
  assert.equal(featureAllowed('fill_notes', { AI_FEATURES: 'poster' }), true)
  assert.equal(featureAllowed('posting_help', { AI_FEATURES: 'guide' }), false)
  assert.equal(featureAllowed('listing_web', { AI_FEATURES: 'listing_qa' }), true)
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
  // A logged-out visitor has $0.10 a day: three 4-cent answers, then no more.
  let allowed = 0
  for (let i = 0; i < 6; i++) {
    const s = await store.takeSlot({ actor: ip })
    if (!s.ok) { assert.equal(s.reason, 'ip'); continue }
    allowed++
    await store.finish(s.id, { cost_usd: 0.04 })
  }
  assert.equal(allowed, 3)
  const spent = await store.spent(ip)
  assert.ok(Math.abs(spent.actor - 0.12) < 1e-9)
  // A cache hit is logged with no cost and moves nothing.
  await store.log({ actor_key: ip.key, cache_hit: true, cost_usd: 0 })
  assert.ok(Math.abs((await store.spent(ip)).actor - 0.12) < 1e-9)
  // The global cap pauses everyone, whoever they are.
  const tiny = getStore({ VERCEL_ENV: 'preview', AI_DAILY_COST_CAP: '0.05' })
  const other = await tiny.takeSlot({ actor: { kind: 'user', key: 'u:fresh-' + Math.random(), userId: 'x' } })
  assert.equal(other.ok, false); assert.equal(other.reason, 'global')
})

test('the usage bar is a percentage and a level, never an amount', () => {
  assert.deepEqual(usageView({ spent: 0, cap: 0.5, globalSpent: 0, globalCap: 5 }), { percent: 0, level: 'ok', paused: false })
  assert.equal(usageView({ spent: 0.0003, cap: 0.1, globalSpent: 0, globalCap: 5 }).percent, 1, 'any use shows on the bar')
  assert.deepEqual(usageView({ spent: 0.2, cap: 0.5, globalSpent: 1, globalCap: 5 }), { percent: 40, level: 'ok', paused: false })
  assert.equal(usageView({ spent: 0.4, cap: 0.5, globalSpent: 1, globalCap: 5 }).level, 'near')
  assert.equal(usageView({ spent: 0.499, cap: 0.5, globalSpent: 1, globalCap: 5 }).percent, 99, 'never 100 before the allowance is used')
  assert.deepEqual(usageView({ spent: 0.51, cap: 0.5, globalSpent: 1, globalCap: 5 }), { percent: 100, level: 'full', paused: false })
  assert.equal(usageView({ spent: 0, cap: 0.5, globalSpent: 5, globalCap: 5 }).paused, true)
  assert.equal(usageView({ spent: 3, cap: null, globalSpent: 3, globalCap: 5 }).percent, 0, 'the system actor has no bar')
  assert.equal(JSON.stringify(usageView({ spent: 0.2, cap: 0.5, globalSpent: 1, globalCap: 5 })).includes('0.2'), false)
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
