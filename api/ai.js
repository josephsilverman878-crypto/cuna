// POST /api/ai  { feature, ...payload }     one endpoint for every AI feature
// GET  /api/ai?feature=health               is the assistant configured?
// GET  /api/ai?feature=usage                how much of today's AI this person
//                                           has used, as a percentage
//
// Kill switch: AI_ENABLED must be 'true' or every feature answers
// { ok: false, reason: 'disabled' } and the browser hides its AI surfaces
// (VITE_AI_ENABLED does the same on the client). Optional allowlist:
// AI_FEATURES="guide,listing_qa".
//
// Env (Vercel, server-side only; never VITE_):
//   ANTHROPIC_API_KEY            the model key. Never sent to the browser.
//   AI_ENABLED                   'true' to run
//   AI_FEATURES                  optional comma list of features to allow
//   AI_USER_DAILY_ALLOWANCE      estimated dollars a signed-in user may use per New York day (default 0.50)
//   AI_VISITOR_DAILY_ALLOWANCE   the same for a logged-out visitor (default 0.10)
//   AI_DAILY_COST_CAP            estimated dollars for everyone together per day (default 5);
//                                at the cap the assistant pauses until midnight New York time
//   AI_WEB_SEARCH_ENABLED        'true' to let the assistant cite public web pages (default off)
//   AI_ACTIONS_ENABLED           'true' for the consented-actions phase (default off)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   limits, cache and usage log
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY public data and sign-in checks
import { modelClient } from './_ai.js'
import { handlers } from './_ai-registry.js'
import { MODELS, aiEnabled, featureAllowed, webSearchEnabled, actionsEnabled, UNAVAILABLE_MESSAGE, allowance, capFor, usageView } from './_ai-config.js'
import { getStore, identify, isAdmin, newRequestId } from './_ai-store.js'
import { readWriteup } from './_ai-writeup.js'

// ---------------------------------------------------------------- health
// Confirms the key works by asking the Models API about the two configured
// models (no tokens are generated, nothing is billed) and checks the store.
// The key itself is never returned. Anyone may see whether the assistant is
// switched on; the detailed check is for admins (and for previews, which sit
// behind Vercel login).
async function health(req, res, env) {
  const actor = await identify(req, env)
  const detailed = env.VERCEL_ENV !== 'production' || await isAdmin(actor, env)
  const out = { ok: true, ai_enabled: aiEnabled(env) }
  if (!detailed) return res.status(200).json(out)

  const client = modelClient(env)
  out.key = client ? 'present' : 'missing'
  out.models = {}
  if (client) {
    for (const [tier, id] of Object.entries(MODELS)) {
      try { await client.models.retrieve(id); out.models[tier] = 'ok' }
      catch (err) { out.models[tier] = err?.status === 401 ? 'key rejected' : err?.status === 404 ? 'model not found' : 'unreachable'; out.key = err?.status === 401 ? 'rejected' : out.key }
    }
  }
  const store = getStore(env)
  out.store = store ? store.kind : 'missing'
  if (store) {
    const t = await store.selfTest()
    out.store_tables = t.usage && t.cache && t.allowance ? 'ok'
      : store.kind === 'memory' ? 'not used on this deployment'
      : t.cache ? 'missing: run 50-ai-allowance.sql' : 'missing: run 49-ai.sql'
  }
  const a = allowance(env)
  out.allowance = { user: a.user, visitor: a.visitor, global: a.global }
  out.web_search = webSearchEnabled(env)
  out.actions = actionsEnabled(env)
  out.environment = env.VERCEL_ENV || 'local'
  out.ok = out.key === 'present' && Object.values(out.models).every(v => v === 'ok')
  return res.status(200).json(out)
}

// How much of today's allowance this person has used. The browser gets a
// percentage and a level, never an amount. Admins also get the day's total
// against the global cap, for the /admin AI tab.
async function usageFor(store, actor, env) {
  const a = allowance(env)
  const s = await store.spent(actor)
  return { view: usageView({ spent: s.actor, cap: capFor(actor, env), globalSpent: s.global, globalCap: a.global }), spent: s, caps: a }
}

async function usage(req, res, env) {
  if (!aiEnabled(env)) return res.status(200).json({ ok: false, reason: 'disabled' })
  const store = getStore(env)
  if (!store) return res.status(200).json({ ok: false, reason: 'not_configured' })
  try {
    const actor = await identify(req, env)
    const u = await usageFor(store, actor, env)
    const out = { ok: true, usage: u.view }
    if (await isAdmin(actor, env)) {
      out.admin = {
        allowance: { user: u.caps.user, visitor: u.caps.visitor, global: u.caps.global },
        spent_today: Number(u.spent.global.toFixed(4)), paused: u.view.paused, store: store.kind,
      }
    }
    return res.status(200).json(out)
  } catch (err) {
    console.error('AI usage read failed:', err?.code || err?.name || 'error')
    return res.status(200).json({ ok: false, reason: 'error' })
  }
}

export default async function handler(req, res) {
  const env = process.env
  const feature = String((req.method === 'GET' ? req.query?.feature : req.body?.feature) || '')
  res.setHeader('Cache-Control', 'no-store')

  if (feature === 'health') return health(req, res, env)
  if (feature === 'usage' && req.method === 'GET') return usage(req, res, env)

  // The stored write-up for a neighborhood page: a plain read, no model call.
  if (feature === 'writeup' && req.method === 'GET') {
    if (!aiEnabled(env) || !featureAllowed('writeup', env)) return res.status(200).json({ ok: false, reason: 'disabled' })
    const output = await readWriteup(req.query?.slug, env).catch(() => null)
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return res.status(200).json({ ok: true, output })
  }
  if (req.method !== 'POST') return res.status(405).json({ ok: false, reason: 'method' })

  if (!aiEnabled(env) || !featureAllowed(feature, env)) {
    return res.status(200).json({ ok: false, reason: 'disabled', message: UNAVAILABLE_MESSAGE })
  }
  const run = handlers[feature]
  if (!run) return res.status(400).json({ ok: false, reason: 'unknown_feature' })

  const client = modelClient(env)
  const store = getStore(env)
  if (!client || !store) {
    console.error('AI not configured:', client ? '' : 'ANTHROPIC_API_KEY missing', store ? '' : 'service-role key missing')
    return res.status(200).json({ ok: false, reason: 'not_configured', message: UNAVAILABLE_MESSAGE })
  }

  try {
    const actor = await identify(req, env)
    const ctx = { env, client, store, actor, requestId: newRequestId(), startedAt: Date.now() }
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const result = await run(ctx, body)
    // Every answer carries the person's updated usage, so the bar on the
    // page moves without a second request. A failed read never fails the answer.
    try { result.usage = (await usageFor(store, actor, env)).view } catch { /* the bar keeps its last value */ }
    return res.status(200).json(result)
  } catch (err) {
    // The message is logged only for our own code's errors (a TypeError and
    // the like), never for a provider error, so no request text can reach the log.
    console.error('AI handler failed:', feature, err?.code || err?.name || 'error', err?.status ? '' : String(err?.message || '').slice(0, 160))
    return res.status(200).json({ ok: false, reason: 'error', message: "Cuna's assistant could not answer just now. Please try again in a moment." })
  }
}
