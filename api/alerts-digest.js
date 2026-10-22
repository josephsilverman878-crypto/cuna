// Saved-listing alert digest. Runs on Vercel Cron (vercel.json) and sends
// each user ONE email summarising their notifications that have not been
// emailed yet, then stamps emailed_at.
//
// SCHEDULE. The spec is every 15 minutes ("*/15 * * * *"). The project is on
// Vercel's Hobby plan, which only accepts once-a-day cron schedules and would
// refuse the deploy otherwise, so vercel.json ships "0 14 * * *" (10am New
// York in summer, 9am in winter). On Pro, change it to "*/15 * * * *".
//
// OFF BY DEFAULT: nothing is sent unless ALERT_EMAILS_ENABLED=true. The in-app
// bell works regardless -- this route only decides whether rows also go out
// by email.
//
// Env vars (Vercel, server-side only; never VITE_):
//   CRON_SECRET                 Vercel sends "Authorization: Bearer <CRON_SECRET>"
//   ALERT_EMAILS_ENABLED        'true' to send; anything else = skip
//   SUPABASE_URL                project URL
//   SUPABASE_SERVICE_ROLE_KEY   service role (bypasses RLS: reads notifications
//                               for every user and writes emailed_at)
//   RESEND_API_KEY              already set for tour emails
//   ALERT_UNSUBSCRIBE_SECRET    HMAC key for the one-click unsubscribe token
//   INQUIRY_TEST_RECIPIENT      on Preview: every email goes here instead
//   PUBLIC_BASE_URL             e.g. https://hellocuna.com (links)
import { createClient } from '@supabase/supabase-js'
import { unsubscribeToken } from './_alerts-token.js'

export default async function handler(req, res) {
  const auth = req.headers.authorization || ''
  if (!process.env.CRON_SECRET || auth !== 'Bearer ' + process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (process.env.ALERT_EMAILS_ENABLED !== 'true') {
    return res.status(200).json({ ok: true, skipped: 'ALERT_EMAILS_ENABLED is not true' })
  }
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || !process.env.RESEND_API_KEY || !process.env.ALERT_UNSUBSCRIBE_SECRET) {
    return res.status(500).json({ error: 'Missing server configuration' })
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  // Everything not yet emailed, oldest first, capped per run.
  const { data: rows, error } = await supabase
    .from('notifications')
    .select('id, user_id, listing_id, kind, message, created_at')
    .is('emailed_at', null)
    .order('created_at', { ascending: true })
    .limit(500)
  if (error) return res.status(500).json({ error: 'Could not read notifications' })
  if (!rows || rows.length === 0) return res.status(200).json({ ok: true, users: 0, sent: 0 })

  const byUser = new Map()
  for (const r of rows) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, [])
    byUser.get(r.user_id).push(r)
  }
  const userIds = [...byUser.keys()]

  const [{ data: profiles }, { data: prefs }] = await Promise.all([
    supabase.from('profiles').select('id, name, email').in('id', userIds),
    supabase.from('renter_profiles').select('id, alert_emails').in('id', userIds),
  ])
  const emailOf = new Map((profiles || []).map(p => [p.id, p]))
  const wants = new Map((prefs || []).map(p => [p.id, p.alert_emails !== false]))

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
  const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '')
  const testRecipient = process.env.INQUIRY_TEST_RECIPIENT
  const now = new Date().toISOString()
  let sent = 0, suppressed = 0, failed = 0

  for (const [userId, items] of byUser) {
    const prof = emailOf.get(userId)
    const ids = items.map(i => i.id)

    // Opted out (or no renter row, or no email): mark as handled so the queue
    // does not grow forever, send nothing.
    if (!prof?.email || !wants.get(userId)) {
      await supabase.from('notifications').update({ emailed_at: now }).in('id', ids)
      suppressed += 1
      continue
    }

    const token = unsubscribeToken(userId, process.env.ALERT_UNSUBSCRIBE_SECRET)
    const unsubUrl = `${base}/api/alerts-unsubscribe?t=${encodeURIComponent(token)}`
    const list = items.map(i => {
      const link = i.listing_id && base ? `${base}/listing/${i.listing_id}` : null
      return '<li style="margin:0 0 8px">' + esc(i.message) +
        (link ? ' — <a href="' + link + '" style="color:#B44A36">View listing</a>' : '') + '</li>'
    }).join('')
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2C2420">
        <h2 style="color:#B44A36">Updates on listings you saved</h2>
        <p>Hi ${esc(prof.name || '')}, here is what changed:</p>
        <ul style="padding-left:18px">${list}</ul>
        <p style="color:#9B8E88;font-size:12px;margin-top:24px">
          You get these because you saved these listings on Cuna.
          <a href="${unsubUrl}" style="color:#9B8E88">Unsubscribe from saved-listing emails</a>
          or change it any time in your profile.
        </p>
      </div>`

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Cuna <hello@hellocuna.com>',
        to: [testRecipient || prof.email],
        subject: items.length === 1 ? items[0].message : `${items.length} updates on listings you saved`,
        html,
        headers: {
          'List-Unsubscribe': `<${unsubUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    })
    if (resp.ok) {
      await supabase.from('notifications').update({ emailed_at: now }).in('id', ids)
      sent += 1
    } else {
      failed += 1
      console.error('Alert digest send failed for user', userId, await resp.text().catch(() => ''))
    }
  }
  return res.status(200).json({ ok: true, users: byUser.size, sent, suppressed, failed })
}
