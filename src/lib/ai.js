import { supabase } from './supabase'

// Cuna's assistant, browser side. The model is only ever called from the
// server (/api/ai); the browser holds no key. This file is the ONE place
// the client reads the AI flags.
//
// Flags (Vercel env, baked in at build time):
//   VITE_AI_ENABLED          'true' shows AI surfaces. Anything else hides
//                            every one of them; the classic quiz, search and
//                            filters keep working untouched.
//   VITE_AI_FEATURES         optional comma list (guide, writeup, draft,
//                            search, listing_qa, recommend, poster, admin).
//                            Unset = every feature. Lets one phase be
//                            switched on without the others. "poster" is the
//                            poster assistant: Fill from notes, Listing
//                            checkup and Posting help.
//   VITE_AI_ACTIONS_ENABLED  'true' for the consented-actions phase.
// The server has its own switches (AI_ENABLED, AI_FEATURES,
// AI_ACTIONS_ENABLED); both sides must be on for a feature to work.

export const AI_ENABLED = String(import.meta.env.VITE_AI_ENABLED || '') === 'true'

const ALLOW = String(import.meta.env.VITE_AI_FEATURES || '').split(',').map(s => s.trim()).filter(Boolean)

export function aiFeature(name) {
  return AI_ENABLED && (ALLOW.length === 0 || ALLOW.includes(name))
}

// Where "take the quiz" links point: the classic quiz moves to
// /new-to-ny/classic only while the assistant's guide holds /new-to-ny.
export const QUIZ_PATH = aiFeature('guide') ? '/new-to-ny/classic' : '/new-to-ny'

export const AI_ACTIONS_ENABLED = AI_ENABLED && String(import.meta.env.VITE_AI_ACTIONS_ENABLED || '') === 'true'

// Shown near every AI surface (src/components/AiLabel.jsx).
export const AI_LABEL =
  "Cuna's assistant recommends neighborhoods in NYC and listings from Cuna based on what you share."

const GENERIC = "Cuna's assistant could not answer just now. Please try again in a moment."

// ---------------------------------------------------------------- usage
// How much of today's AI allowance this person has used. The server sends
// a percentage and a level with every answer, never an amount:
//   { percent: 0-100, level: 'ok' | 'near' | 'full', paused: boolean }
// One shared value for the page, so every usage bar shows the same thing
// and moves as soon as an answer arrives.
let usageState = null
let usageLoad = null
const usageListeners = new Set()

function setUsage(u) {
  if (!u || typeof u.percent !== 'number') return
  usageState = { percent: u.percent, level: u.level || 'ok', paused: Boolean(u.paused) }
  usageListeners.forEach(fn => fn(usageState))
}

export function getUsage() {
  return usageState
}

export function subscribeUsage(fn) {
  usageListeners.add(fn)
  return () => usageListeners.delete(fn)
}

// Reads the current value once per page load (no model call, no cost).
// Returns the whole reply, which for an admin also carries the day's total.
export function loadUsage(force = false) {
  if (!AI_ENABLED) return Promise.resolve(null)
  if (!usageLoad || force) {
    usageLoad = (async () => {
      try {
        const res = await fetch('/api/ai?feature=usage', { headers: await authHeader() })
        const body = await res.json()
        if (body?.ok) setUsage(body.usage)
        return body
      } catch {
        return null
      }
    })()
  }
  return usageLoad
}

async function authHeader() {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    return token ? { Authorization: 'Bearer ' + token } : {}
  } catch {
    return {}
  }
}

// One call shape for every feature. Never throws: the answer is always
//   { ok: true, output, cached, sources, fallback }
//   { ok: false, reason, message }   reason: disabled | limit | error | ...
// so a caller can show `message` and carry on.
export async function aiRequest(feature, payload = {}, { signal } = {}) {
  if (!AI_ENABLED) return { ok: false, reason: 'disabled', message: GENERIC }
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ ...payload, feature }),
      signal,
    })
    const body = await res.json().catch(() => null)
    if (!body || typeof body !== 'object') return { ok: false, reason: 'error', message: GENERIC }
    if (!body.ok && !body.message) body.message = GENERIC
    if (body.usage) setUsage(body.usage)
    else if (body.reason === 'limit') setUsage({ percent: body.limit === 'global' ? (usageState?.percent ?? 0) : 100, level: body.limit === 'global' ? (usageState?.level ?? 'ok') : 'full', paused: body.limit === 'global' })
    return body
  } catch (err) {
    if (err?.name === 'AbortError') return { ok: false, reason: 'aborted', message: '' }
    console.error('AI request failed:', feature, err)
    return { ok: false, reason: 'error', message: GENERIC }
  }
}

// Is the assistant configured on this deployment? Admins get the detail
// (key present, models reachable, tables present); nobody gets the key.
export async function aiHealth() {
  try {
    const res = await fetch('/api/ai?feature=health', { headers: await authHeader() })
    return await res.json()
  } catch (err) {
    console.error('AI health check failed:', err)
    return { ok: false, error: 'unreachable' }
  }
}

// Usage aggregates for /admin (admin_ai_costs and admin_ai_days,
// 50-ai-allowance.sql). Rows are per day and feature, or per day; no
// row-level data and no content ever leaves the table.
export async function adminAiCosts(days = 14) {
  return supabase.rpc('admin_ai_costs', { p_days: days })
}

// userCap / visitorCap: today's allowances, so the database can count the
// people whose day reached 100% of theirs.
export async function adminAiDays(days = 14, userCap = null, visitorCap = null) {
  return supabase.rpc('admin_ai_days', { p_days: days, p_user_cap: userCap, p_visitor_cap: visitorCap })
}
