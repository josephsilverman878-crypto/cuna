// Neighborhood write-ups (AI phase 3, item 3.1).
//
// An admin asks for a write-up of one neighborhood. The server gathers the
// facts Cuna holds for it (the same rows the guide uses), Sonnet writes a
// short factual paragraph, the server checks it (every number must come
// from the facts; fair-housing scan), and saves it through
// admin_save_writeup(), a database function that itself refuses anyone who
// is not an admin. The neighborhood page reads the stored text; nothing is
// generated when a visitor opens a page.
import { z } from 'zod'
import { runAi } from './_ai.js'
import { isAdmin, userClient, publicClient } from './_ai-store.js'
import { loadCity, figuresFor } from './_ai-city.js'
import { MODELS } from './_ai-config.js'

const schema = z.object({ body: z.string() })
export const WRITEUP_LABEL = "Written by Cuna's assistant from public data"

const SYSTEM = `You write a short factual summary of one New York City neighborhood for its page on Cuna. Use ONLY the FACTS in the message.

Rules
- 70 to 130 words, plain sentences, one or two paragraphs. No headline, no bullet points, no emojis.
- Describe the place: where it is, its streets, parks and storefronts as the FACTS give them, its subway lines, and what homes cost where the FACTS give a figure. If the FACTS hold no price figure, say Cuna holds none yet.
- Never describe who lives there or who it suits, and never rate safety, schools or character.
- Use a number or a dollar amount only if it appears in the FACTS, written the same way. Do not name the sources in the text; the page lists them underneath.
- No sales language and no advice.`

function factsFor(hood, asOf) {
  const rent = figuresFor(hood, 'rent', null, asOf)
  const buy = figuresFor(hood, 'buy', null, asOf)
  const lines = [
    `Name: ${hood.name}`,
    `Borough: ${hood.borough}`,
    `Subway lines with a station inside the neighborhood: ${hood.lines.length ? hood.lines.join(', ') : 'none'}`,
  ]
  for (const f of [...rent, ...buy]) lines.push(`${f.label}: ${f.value}`)
  if (rent.length + buy.length === 0) lines.push('Price figures: none held by Cuna')
  if (hood.listings.rent.count + hood.listings.sale.count === 0) lines.push('Listings on Cuna now: none')
  if (hood.ref) {
    lines.push(`About the place: ${hood.ref.description}`)
    for (const h of hood.ref.highlights || []) lines.push(`Also: ${h}`)
  }
  const sources = [
    { label: 'Subway lines', source: 'MTA subway station list (NY Open Data)', as_of: asOf, boundary: "stations inside Cuna's neighborhood boundary" },
    ...[...rent, ...buy].map(({ label, source, as_of, boundary }) => ({ label, source, as_of, boundary })),
  ]
  if (hood.ref) sources.push({ label: 'Streets, parks and storefronts', source: "Cuna's own notes on the place", as_of: asOf, boundary: `the area named ${hood.refArea}` })
  return { lines, sources }
}

export function checkWriteup(out, facts) {
  const text = String(out?.body || '')
  if (text.length < 180) return 'The summary is too short. Write 70 to 130 words from the FACTS.'
  if (text.length > 1400) return 'The summary is too long. Keep it under 130 words.'
  const hay = facts.join('\n').replace(/,/g, '')
  for (const m of text.matchAll(/\$?\d[\d,]*(?:\.\d+)?/g)) {
    const n = m[0].replace(/,/g, '').replace(/\.$/, '')
    if (!hay.includes(n)) return `The summary uses ${m[0]}, which is not in the FACTS. Use only numbers from the FACTS.`
  }
  return null
}

export function factualWriteup(hood, asOf) {
  const parts = [`${hood.name} is in ${hood.borough}.`]
  parts.push(hood.lines.length ? `Subway lines with a station inside the neighborhood: ${hood.lines.join(', ')}.` : 'No subway station sits inside the neighborhood.')
  const figs = [...figuresFor(hood, 'rent', null, asOf), ...figuresFor(hood, 'buy', null, asOf)]
  for (const f of figs) parts.push(`${f.label}: ${f.value}.`)
  if (figs.length === 0) parts.push('Cuna does not hold a price figure for this neighborhood yet.')
  return parts.join(' ')
}

// POST { feature: 'writeup', slug }  (admins only)
export async function writeup(ctx, body) {
  if (!(await isAdmin(ctx.actor, ctx.env))) return { ok: false, reason: 'forbidden', message: 'Admins only.' }
  const city = ctx.city || await loadCity(ctx.env)
  const hood = city.bySlug.get(String(body.slug || ''))
  if (!hood) return { ok: false, reason: 'not_found', message: 'That neighborhood is not in Cuna’s table.' }
  const { lines, sources } = factsFor(hood, city.asOf)
  // An admin writing pages is not one person's daily use: the per-user cap
  // does not apply, the global daily cap still does.
  const r = await runAi({ ...ctx, actor: { kind: 'system', key: 'admin-writeups', userId: ctx.actor.userId } }, {
    feature: 'writeup',
    system: SYSTEM,
    user: 'FACTS\n' + lines.join('\n'),
    schema,
    scanText: (o) => o.body,
    validate: (o) => checkWriteup(o, lines),
    fallback: { body: factualWriteup(hood, city.asOf) },
  })
  if (!r.ok) return r
  const text = String(r.output.body).replace(/[ \t]+/g, ' ').trim().slice(0, 2400)
  const out = { kind: 'writeup', slug: hood.slug, name: hood.name, body: text, sources, fallback: Boolean(r.fallback), saved: false, save_error: null }
  const db = (ctx.userClient || userClient)(ctx.actor.token, ctx.env)
  if (!db) { out.save_error = 'not_signed_in'; return { ok: true, cached: false, output: out } }
  const { error } = await db.rpc('admin_save_writeup', {
    p_neighborhood: hood.id, p_body: text, p_sources: sources, p_data_version: city.version, p_model: r.fallback ? 'facts-only' : MODELS.smart,
  })
  if (error) {
    out.save_error = error.code === 'PGRST202' || error.code === '42883' ? 'tables_missing' : 'save_failed'
    if (out.save_error === 'save_failed') console.error('admin_save_writeup failed:', error.code)
  } else {
    out.saved = true
  }
  return { ok: true, cached: false, output: out }
}

// GET /api/ai?feature=writeup&slug=...  The stored, visible write-up for a
// neighborhood page, or null. Read with the public key, so a hidden
// write-up cannot come back.
export async function readWriteup(slug, env) {
  const db = publicClient(env)
  if (!db || !/^[a-z0-9-]{1,80}$/.test(String(slug || ''))) return null
  const hood = await db.from('neighborhoods').select('id').eq('slug', slug).maybeSingle()
  if (hood.error || !hood.data) return null
  const w = await db.from('neighborhood_writeups').select('body, sources, generated_at').eq('neighborhood_id', hood.data.id).maybeSingle()
  if (w.error || !w.data) return null
  return { body: w.data.body, sources: Array.isArray(w.data.sources) ? w.data.sources : [], generated_at: w.data.generated_at, label: WRITEUP_LABEL }
}
