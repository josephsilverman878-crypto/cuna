// Storage for Cuna's assistant: who is asking, the daily usage allowance,
// the answer cache and the usage log (ai_usage / ai_cache, 49-ai.sql and
// 50-ai-allowance.sql).
//
// Two stores with the same interface:
//   - serviceStore: the real one. Uses the Supabase service-role key, which
//     only exists on the server. ai_usage and ai_cache have no policies for
//     anon or authenticated, so nothing else can read or write them.
//   - memoryStore: per-instance cost counters, no cache, nothing persisted. Used
//     only OUTSIDE production when the service-role key is absent (preview
//     deployments sit behind Vercel login). Production refuses to run the
//     assistant without the real store, so the limits can never be skipped
//     there by a missing key.
//
// Nothing here stores what a person typed or what the assistant answered,
// except the cache, which holds the ANSWER under a hash of the request for a
// limited time and without any account or IP.
import { createClient } from '@supabase/supabase-js'
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { allowance, capFor } from './_ai-config.js'

export function nyDay(d = new Date()) {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

export function sha256(text) {
  return createHash('sha256').update(text).digest('hex')
}

// Sorted-key JSON so the same request always hashes the same.
export function stableJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']'
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stableJson(value[k])).join(',') + '}'
}

export function supabaseUrl(env = process.env) {
  return env.SUPABASE_URL || env.VITE_SUPABASE_URL || null
}

// Public-data client (anon key). Reads only what any visitor can read.
export function publicClient(env = process.env) {
  const url = supabaseUrl(env)
  const key = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

// A client that acts as the signed-in user (their own JWT), for reads that
// their own RLS allows: is_admin on their profile row, their saved searches.
export function userClient(token, env = process.env) {
  const url = supabaseUrl(env)
  const key = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY
  if (!url || !key || !token) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: 'Bearer ' + token } },
  })
}

function serviceClient(env = process.env) {
  const url = env.SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function clientIp(req) {
  const h = req.headers || {}
  const real = h['x-real-ip']
  if (real) return String(real).trim()
  const fwd = h['x-forwarded-for']
  if (fwd) return String(fwd).split(',')[0].trim()
  return req.socket?.remoteAddress || 'unknown'
}

// Who is asking. A signed-in user is identified by their Supabase token
// (verified with Supabase Auth); everyone else by a keyed hash of their IP
// that changes every day, so the raw IP is never stored and yesterday's
// hash cannot be linked to today's.
export async function identify(req, env = process.env) {
  const auth = String(req.headers?.authorization || '')
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null
  if (token) {
    const anon = publicClient(env)
    if (anon) {
      const { data, error } = await anon.auth.getUser(token)
      if (!error && data?.user?.id) {
        // The limit key is a keyed hash of the account id, not the id itself,
        // so a deleted account leaves nothing readable behind in ai_usage
        // (user_id is set to null by the foreign key).
        const key = createHmac('sha256', hashSecret(env)).update('user|' + data.user.id).digest('hex').slice(0, 40)
        return { kind: 'user', key: 'u:' + key, userId: data.user.id, token }
      }
    }
  }
  const key = createHmac('sha256', hashSecret(env)).update(clientIp(req) + '|' + nyDay()).digest('hex').slice(0, 40)
  return { kind: 'ip', key: 'ip:' + key, userId: null, token: null }
}

function hashSecret(env) {
  return env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || 'cuna-assistant'
}

export async function isAdmin(actor, env = process.env) {
  if (actor?.kind !== 'user' || !actor.token) return false
  const c = userClient(actor.token, env)
  if (!c) return false
  const { data, error } = await c.from('profiles').select('is_admin').eq('id', actor.userId).maybeSingle()
  return !error && data?.is_admin === true
}

// ---------------------------------------------------------------- stores
// Both stores share one interface:
//   takeSlot({ requestId, feature, actor })  checks the person's daily usage
//       allowance and the global daily cost cap, then opens a usage row.
//       -> { ok: true, id, spent, global } | { ok: false, reason, spent, global }
//       reason: 'user' | 'ip' (their own allowance) | 'global' (the cap)
//   finish(id, fields)   closes that row with tokens, cost and status
//   log(row)             an extra row: a second model call, or a cache hit
//   spent(actor)         -> { actor, global } estimated dollars so far today
// The allowance is measured in estimated cost, so it is counted from the
// cost_usd of the rows themselves; a cache hit costs nothing and moves nothing.
function serviceStore(db, env) {
  return {
    kind: 'service',
    async takeSlot({ requestId, feature, actor }) {
      const a = allowance(env)
      const { data, error } = await db.rpc('ai_begin', {
        p_request: requestId, p_feature: feature, p_actor_kind: actor.kind, p_actor_key: actor.key,
        p_user: actor.userId, p_actor_cap: capFor(actor, env), p_global_cap: a.global, p_reserve: a.reserve,
      })
      if (error) throw Object.assign(new Error('ai_begin failed: ' + error.message), { code: 'store' })
      return data
    },
    async finish(id, fields) {
      if (!id) return
      const { error } = await db.from('ai_usage').update(fields).eq('id', id)
      if (error) console.error('ai_usage update failed:', error.code, error.message)
    },
    // Extra rows: second model calls of one request, cache hits. Their cost
    // (zero for a cache hit) counts toward the allowance like any other row.
    async log(row) {
      const { error } = await db.from('ai_usage').insert({ counted: false, ...row })
      if (error) console.error('ai_usage insert failed:', error.code, error.message)
    },
    async spent(actor) {
      const { data, error } = await db.rpc('ai_spent', { p_actor_key: actor.key })
      if (error) throw Object.assign(new Error('ai_spent failed: ' + error.message), { code: 'store' })
      return { actor: Number(data?.actor) || 0, global: Number(data?.global) || 0 }
    },
    async cacheGet(hash, dataVersion, maxAgeDays) {
      const { data, error } = await db.from('ai_cache').select('output, model, created_at, data_version').eq('input_hash', hash).maybeSingle()
      if (error || !data) return null
      if (data.data_version !== dataVersion) return null
      if (maxAgeDays && Date.now() - new Date(data.created_at).getTime() > maxAgeDays * 86400000) return null
      return data
    },
    async cacheSet(hash, { feature, dataVersion, model, output }) {
      const { error } = await db.from('ai_cache').upsert({
        input_hash: hash, feature, data_version: dataVersion, model, output, created_at: new Date().toISOString(),
      })
      if (error) console.error('ai_cache write failed:', error.code, error.message)
      // Housekeeping: answers older than 30 days are removed, so nothing the
      // assistant wrote is kept long-term.
      const cutoff = new Date(Date.now() - 30 * 86400000).toISOString()
      await db.from('ai_cache').delete().lt('created_at', cutoff)
    },
    // The tables of 49-ai.sql and the allowance pieces of 50-ai-allowance.sql.
    async selfTest() {
      const { error: e1 } = await db.from('ai_usage').select('id, web_searches, search_cost_usd').limit(1)
      const { error: e2 } = await db.from('ai_cache').select('input_hash').limit(1)
      const { error: e3 } = await db.rpc('ai_spent', { p_actor_key: 'selftest' })
      return { usage: !e1, cache: !e2, allowance: !e3, error: (e1 || e2 || e3)?.message || null }
    },
  }
}

const mem = { day: null, actors: new Map(), total: 0 }
function memToday() {
  const today = nyDay()
  if (mem.day !== today) { mem.day = today; mem.actors = new Map(); mem.total = 0 }
}
function memAdd(key, cost) {
  const c = Number(cost) || 0
  if (!key || c <= 0) return
  memToday()
  mem.actors.set(key, (mem.actors.get(key) || 0) + c); mem.total += c
}
function memoryStore(env) {
  return {
    kind: 'memory',
    async takeSlot({ actor }) {
      memToday()
      const a = allowance(env)
      const spent = mem.actors.get(actor.key) || 0
      const cap = capFor(actor, env)
      const state = { spent, global: mem.total }
      if (mem.total >= a.global) return { ok: false, reason: 'global', ...state }
      if (cap != null && spent >= cap) return { ok: false, reason: actor.kind === 'user' ? 'user' : 'ip', ...state }
      return { ok: true, id: 'm:' + actor.key, ...state }
    },
    async finish(id, fields) { if (typeof id === 'string' && id.startsWith('m:')) memAdd(id.slice(2), fields?.cost_usd) },
    async log(row) { memAdd(row?.actor_key, row?.cost_usd) },
    async spent(actor) { memToday(); return { actor: mem.actors.get(actor.key) || 0, global: mem.total } },
    async cacheGet() { return null }, async cacheSet() {},
    async selfTest() { return { usage: false, cache: false, allowance: false, error: 'no service-role key on this deployment' } },
  }
}

// Returns the store, or null when the assistant must not run (production
// without the service-role key).
export function getStore(env = process.env) {
  const db = serviceClient(env)
  if (db) return serviceStore(db, env)
  if (env.VERCEL_ENV === 'production') return null
  return memoryStore(env)
}

export function newRequestId() {
  return randomUUID()
}
