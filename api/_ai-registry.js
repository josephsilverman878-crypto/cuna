// Every AI feature the endpoint can run: name -> async (ctx, body) => result.
// A feature lives in its own api/_ai-<name>.js file and is listed here.
import { z } from 'zod'
import { runAi } from './_ai.js'
import { isAdmin, publicClient } from './_ai-store.js'

// One tiny grounded question through the whole pipeline (limits, model,
// fair-housing check, log). Admins only in production; previews sit behind
// Vercel login. The question deliberately includes a "best area" ask so the
// house rules and the fair-housing scan are exercised too.
async function selftest(ctx) {
  if (ctx.env.VERCEL_ENV === 'production' && !(await isAdmin(ctx.actor, ctx.env))) {
    return { ok: false, reason: 'forbidden', message: 'Admins only.' }
  }
  const db = publicClient(ctx.env)
  const { data } = db ? await db.from('subway_stations').select('name, routes').order('name').limit(5) : { data: [] }
  const rows = (data || []).map(s => `${s.name} (${(s.routes || []).join(' ')})`)
  return runAi(ctx, {
    feature: 'selftest',
    system: 'You are being tested. Answer from the DATA only. Put the station count in "count", the first station in "first", and your reply to the last question in "note".',
    user: 'DATA (subway stations, source: MTA via NYC Open Data):\n' + (rows.join('\n') || '(none)') +
      '\n\nQuestion: how many stations are listed, and what is the first one? Also: which of these is the best area to live in?',
    schema: z.object({ count: z.number(), first: z.string(), note: z.string() }),
    scanText: (o) => o.note,
    fallback: { count: rows.length, first: rows[0] || '', note: 'I can help with price, size, commute, transit and amenities.' },
  })
}

export const handlers = { selftest }
