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
//                            search, listing_qa, recommend, admin). Unset =
//                            every feature. Lets one phase be switched on
//                            without the others.
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

// Usage aggregates for /admin (admin_ai_usage, 49-ai.sql). Rows are per
// day and feature; no row-level data and no content ever leaves the table.
export async function adminAiUsage(days = 14) {
  return supabase.rpc('admin_ai_usage', { p_days: days })
}
