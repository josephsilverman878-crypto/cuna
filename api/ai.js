// POST /api/ai  { feature, ...payload }     one endpoint for every AI feature
// GET  /api/ai?feature=health               is the assistant configured?
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
//   AI_DAILY_REQUEST_CAP         global requests per New York day (default 500)
//   AI_WEB_SEARCH_ENABLED        'true' to let the assistant cite public web pages (default off)
//   AI_ACTIONS_ENABLED           'true' for the consented-actions phase (default off)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   limits, cache and usage log
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY public data and sign-in checks
import { modelClient } from './_ai.js'
import { handlers } from './_ai-registry.js'
import { MODELS, aiEnabled, featureAllowed, webSearchEnabled, actionsEnabled, UNAVAILABLE_MESSAGE, limits } from './_ai-config.js'
import { getStore, identify, isAdmin, newRequestId } from './_ai-store.js'

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
    out.store_tables = t.usage && t.cache ? 'ok' : (store.kind === 'memory' ? 'not used on this deployment' : 'missing: run 49-ai.sql')
  }
  out.limits = limits(env)
  out.web_search = webSearchEnabled(env)
  out.actions = actionsEnabled(env)
  out.environment = env.VERCEL_ENV || 'local'
  out.ok = out.key === 'present' && Object.values(out.models).every(v => v === 'ok')
  return res.status(200).json(out)
}

export default async function handler(req, res) {
  const env = process.env
  const feature = String((req.method === 'GET' ? req.query?.feature : req.body?.feature) || '')
  res.setHeader('Cache-Control', 'no-store')

  if (feature === 'health') return health(req, res, env)
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
    return res.status(200).json(result)
  } catch (err) {
    // The message is logged only for our own code's errors (a TypeError and
    // the like), never for a provider error, so no request text can reach the log.
    console.error('AI handler failed:', feature, err?.code || err?.name || 'error', err?.status ? '' : String(err?.message || '').slice(0, 160))
    return res.status(200).json({ ok: false, reason: 'error', message: "Cuna's assistant could not answer just now. Please try again in a moment." })
  }
}
