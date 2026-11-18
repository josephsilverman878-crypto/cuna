// Cuna's assistant: the shared pipeline every AI feature goes through.
//
//   runAi(ctx, spec)
//     1. cache   identical request + same data version -> stored answer, no model call
//     2. limits  the person's daily usage allowance and the global daily
//                cost cap, both in estimated dollars (ai_begin)
//     3. model   one Claude call with timeout and retries (the SDK retries
//                429 / 5xx / connection errors itself)
//     4. checks  the feature's own grounding check, then the fair-housing scan
//                (src/lib/fairHousing.js). A failure regenerates ONCE with a
//                stricter instruction; a second failure returns a neutral
//                message instead of the model's words.
//     5. log     counts, model, tokens, web searches, cost estimate, errors.
//                Never content.
//
// Model calls happen only here, on the server, with ANTHROPIC_API_KEY. The
// key is never sent to the browser and never logged.
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { scanAssistantOutput } from '../src/lib/fairHousing.js'
import {
  MODELS, FEATURES, PROMPT_VERSION, HOUSE_RULES, NEUTRAL_FALLBACK, LIMIT_MESSAGES,
  estimateCost, searchCost, webSearchEnabled,
} from './_ai-config.js'
import { sha256, stableJson, nyDay } from './_ai-store.js'

const REQUEST_TIMEOUT_MS = 22_000
const TOTAL_BUDGET_MS = 50_000

let sharedClient = null
export function modelClient(env = process.env) {
  if (!env.ANTHROPIC_API_KEY) return null
  if (!sharedClient) {
    sharedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: REQUEST_TIMEOUT_MS })
  }
  return sharedClient
}

// The answer's words. After a web search only the text that follows the
// last search result counts, so "let me look that up" never reaches a page.
function textOf(content) {
  const blocks = content || []
  let from = 0
  blocks.forEach((b, i) => { if (b.type === 'web_search_tool_result') from = i + 1 })
  return blocks.slice(from).filter(b => b.type === 'text').map(b => b.text).join('')
}

// The web pages the answer actually cites (title and link only; the page's
// content is never kept). A page that was found but not cited is not listed.
function sourcesOf(content) {
  const out = []
  const seen = new Set()
  for (const b of content || []) {
    if (b.type !== 'text' || !Array.isArray(b.citations)) continue
    for (const c of b.citations) {
      if (c?.type !== 'web_search_result_location' || !/^https?:\/\//i.test(String(c.url || ''))) continue
      const url = String(c.url).slice(0, 400)
      if (seen.has(url)) continue
      seen.add(url)
      out.push({ url, title: String(c.title || url).replace(/\s+/g, ' ').trim().slice(0, 140) })
    }
  }
  return out.slice(0, 6)
}

function addUsage(total, u = {}) {
  for (const k of ['input_tokens', 'output_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens']) {
    total[k] = (total[k] || 0) + (u[k] || 0)
  }
  // Web searches arrive as usage.server_tool_use.web_search_requests from the
  // API, and as web_search_requests once added up here.
  total.web_search_requests = (total.web_search_requests || 0) +
    (u.server_tool_use?.web_search_requests || u.web_search_requests || 0)
  return total
}

// One model call. `client` is injectable so the tests can run without the API.
//   system: string (the house rules are prepended and cached)
//   user:   string
//   schema: zod schema for a JSON answer, or null for plain text
// Returns { text, parsed, usage, model, stop, sources }.
export async function callModel(client, { feature, system, user, schema, extraNote, webSearch }) {
  const cfg = FEATURES[feature]
  if (!cfg) throw Object.assign(new Error('unknown feature ' + feature), { code: 'feature' })
  const model = MODELS[cfg.tier]
  const params = {
    model,
    max_tokens: cfg.maxTokens,
    system: [
      { type: 'text', text: HOUSE_RULES, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: system },
    ],
    messages: [{ role: 'user', content: extraNote ? user + '\n\n' + extraNote : user }],
    output_config: { effort: cfg.effort },
  }
  if (schema) params.output_config.format = zodOutputFormat(schema)
  if (webSearch) {
    // Search results only: the assistant may cite and link a public page. It
    // never fetches a page itself (no web_fetch tool), and answers that used
    // search are not cached, so no third-party content is stored.
    params.tools = [{
      type: cfg.tier === 'smart' ? 'web_search_20260209' : 'web_search_20250305',
      name: 'web_search', max_uses: 2,
      user_location: { type: 'approximate', city: 'New York', region: 'New York', country: 'US', timezone: 'America/New_York' },
    }]
  }

  const usage = {}
  let response
  let messages = params.messages
  for (let turn = 0; turn < 3; turn++) {
    if (cfg.tier === 'smart') {
      // Sonnet may decline a request for policy reasons; the server-side
      // fallback retries the declines that have a recommended substitute.
      response = await client.beta.messages.create({
        ...params, messages, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      })
    } else {
      response = await client.messages.create({ ...params, messages })
    }
    addUsage(usage, response.usage)
    if (response.stop_reason !== 'pause_turn') break
    messages = [...messages, { role: 'assistant', content: response.content }]
  }

  const stop = response.stop_reason
  const text = textOf(response.content)
  let parsed = null
  if (schema && stop !== 'refusal' && text) {
    try {
      const candidate = JSON.parse(text)
      const check = schema.safeParse(candidate)
      parsed = check.success ? check.data : null
    } catch { parsed = null }
  }
  return { text, parsed, usage, model: response.model || model, stop, sources: sourcesOf(response.content) }
}

function errorCode(err) {
  if (err instanceof Anthropic.AuthenticationError) return 'auth'
  if (err instanceof Anthropic.PermissionDeniedError) return 'permission'
  if (err instanceof Anthropic.RateLimitError) return 'rate_limit'
  if (err instanceof Anthropic.BadRequestError) return 'bad_request'
  if (err instanceof Anthropic.APIConnectionTimeoutError) return 'timeout'
  if (err instanceof Anthropic.APIConnectionError) return 'connection'
  if (err instanceof Anthropic.APIError) return 'api_' + (err.status || 'error')
  return String(err?.code || 'error').slice(0, 40)
}

// spec:
//   feature        key of FEATURES
//   system, user   prompt text (the grounding rows go in `user` or `system`)
//   schema         zod schema, or null for a plain-text answer
//   cacheInput     anything JSON-able that identifies the request, or null to skip the cache
//   dataVersion    string that changes when the grounding data changes
//   scanText(out)  the words to run through the fair-housing scan (default: all strings)
//   validate(out, { sources })  returns a correction note if the answer is
//                  not grounded, else null (sources: the cited web pages)
//   fallback       the neutral answer in this feature's shape
//   counted        false for the second model call of one request
//   webSearch      true to allow search (only when AI_WEB_SEARCH_ENABLED=true)
// ctx: { store, actor, requestId, client, env, startedAt }
// Returns { ok: true, output, cached, sources } | { ok: false, reason, message }.
export async function runAi(ctx, spec) {
  const env = ctx.env || process.env
  const cfg = FEATURES[spec.feature]
  const model = MODELS[cfg.tier]
  const startedAt = ctx.startedAt || Date.now()
  const t0 = Date.now()
  const counted = spec.counted !== false
  const useSearch = Boolean(spec.webSearch && webSearchEnabled(env) && !spec.schema)
  const base = {
    request_id: ctx.requestId, feature: spec.feature, actor_kind: ctx.actor.kind, actor_key: ctx.actor.key,
    user_id: ctx.actor.userId, day: nyDay(),
  }

  // 1. cache
  let hash = null
  if (spec.cacheInput != null && cfg.cacheDays > 0 && !useSearch) {
    hash = sha256(stableJson([spec.feature, model, PROMPT_VERSION, spec.cacheInput]))
    const hit = await ctx.store.cacheGet(hash, spec.dataVersion || '', cfg.cacheDays)
    if (hit) {
      await ctx.store.log({ ...base, model: hit.model, cache_hit: true, status: 'ok', duration_ms: Date.now() - t0 })
      return { ok: true, output: hit.output, cached: true, sources: [] }
    }
  }

  // 2. limits
  let slotId = null
  if (counted) {
    const slot = await ctx.store.takeSlot({ requestId: ctx.requestId, feature: spec.feature, actor: ctx.actor })
    if (!slot?.ok) {
      const reason = slot?.reason || 'global'
      return { ok: false, reason: 'limit', limit: reason, message: LIMIT_MESSAGES[reason] || LIMIT_MESSAGES.global }
    }
    slotId = slot.id
  }

  const usage = {}
  let regenerations = 0
  let usedFallback = false
  let status = 'ok'
  let code = null
  let output = null
  let sources = []
  let answeredBy = model

  const scan = (out) => {
    const words = spec.scanText ? spec.scanText(out) : collectStrings(out)
    return scanAssistantOutput(words)
  }
  const attempt = async (extraNote) => {
    const r = await callModel(ctx.client, {
      feature: spec.feature, system: spec.system, user: spec.user, schema: spec.schema, extraNote, webSearch: useSearch,
    })
    addUsage(usage, r.usage)
    answeredBy = r.model
    return r
  }

  try {
    // 3. model
    let r = await attempt(null)
    if (r.stop === 'refusal') {
      status = 'refused'; usedFallback = true; output = spec.fallback
    } else if (r.stop === 'max_tokens') {
      throw Object.assign(new Error('answer cut off'), { code: 'max_tokens' })
    } else {
      let out = spec.schema ? r.parsed : r.text.trim()
      if (out == null || out === '') throw Object.assign(new Error('unreadable answer'), { code: 'parse' })
      sources = r.sources

      // 4. checks: grounding first, then fair housing; one regeneration in all
      const problem = () => {
        const note = spec.validate ? spec.validate(out, { sources }) : null
        if (note) return { kind: 'grounding', note }
        const fh = scan(out)
        if (!fh.ok) {
          return {
            kind: 'fair_housing',
            note: 'Your previous draft was rejected because it used wording that is not allowed (' +
              fh.hits.map(h => '"' + h.phrase + '"').slice(0, 6).join(', ') +
              '). Write it again. State only facts from the data. Do not describe any place or home by who lives there, who it suits, its safety, its character, or the quality of its schools.',
          }
        }
        return null
      }
      let p = problem()
      if (p && Date.now() - startedAt < TOTAL_BUDGET_MS - REQUEST_TIMEOUT_MS) {
        regenerations = 1
        r = await attempt(p.kind === 'grounding'
          ? 'Your previous draft was rejected: ' + p.note + ' Answer again using only the data provided.'
          : p.note)
        if (r.stop !== 'refusal' && r.stop !== 'max_tokens') {
          const again = spec.schema ? r.parsed : r.text.trim()
          if (again != null && again !== '') { out = again; sources = r.sources }
        }
        p = problem()
      }
      if (p) { usedFallback = true; status = 'fallback'; code = p.kind; output = spec.fallback; sources = [] }
      else output = out
    }
  } catch (err) {
    status = 'error'; code = errorCode(err)
    console.error('AI request failed:', spec.feature, code)
  }

  // 5. log (no content)
  const fields = {
    model: answeredBy, status, error_code: code,
    input_tokens: usage.input_tokens || 0, output_tokens: usage.output_tokens || 0,
    cache_read_tokens: usage.cache_read_input_tokens || 0, cache_write_tokens: usage.cache_creation_input_tokens || 0,
    cost_usd: Number(estimateCost(answeredBy, usage).toFixed(6)),
    web_searches: usage.web_search_requests || 0, search_cost_usd: Number(searchCost(usage).toFixed(6)),
    fh_regenerations: regenerations, fh_fallback: usedFallback && code === 'fair_housing',
    web_search: useSearch, duration_ms: Date.now() - t0,
  }
  if (counted) await ctx.store.finish(slotId, fields)
  else await ctx.store.log({ ...base, ...fields })

  if (status === 'error') {
    return { ok: false, reason: 'error', message: "Cuna's assistant could not answer just now. Please try again in a moment." }
  }
  if (hash && !usedFallback) {
    await ctx.store.cacheSet(hash, { feature: spec.feature, dataVersion: spec.dataVersion || '', model: answeredBy, output })
  }
  return { ok: true, output, cached: false, sources, fallback: usedFallback }
}

// Every string in a JSON answer, joined, for the fair-housing scan.
export function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach(v => collectStrings(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach(v => collectStrings(v, out))
  return out.join('\n')
}

export { NEUTRAL_FALLBACK }
