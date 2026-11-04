// Saved-listing alert digest. Runs on Vercel Cron (vercel.json) and sends
// each user ONE email summarising their notifications that have not been
// emailed yet (everything since that user's last summary), grouped by
// listing, then stamps emailed_at. Every saver gets them: the emails come with
// the save; unsaving a listing stops them (and the bell rows) for that listing.
//
// SCHEDULE. Built for twice a day (about 9 AM and 7 PM New York). The project
// is on Vercel's Hobby plan, which only accepts once-a-day cron schedules and
// would refuse the deploy otherwise, so vercel.json ships "0 14 * * *". On
// Pro, change that one line to "0 0,14 * * *" (see launch-runbook.md).
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
//   INQUIRY_TEST_RECIPIENT      on Preview: every email goes here instead
//   PUBLIC_BASE_URL             e.g. https://hellocuna.com (links)
import { createClient } from '@supabase/supabase-js'
import { renderDigest } from './_alerts-email.js'

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
  if (!url || !key || !process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Missing server configuration' })
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  // Everything not yet emailed, oldest first, capped per run. A user with more
  // than the cap simply gets the rest in the next run.
  const { data: rows, error } = await supabase
    .from('notifications')
    .select('id, user_id, listing_id, kind, message, line, detail_fields, created_at')
    .is('emailed_at', null)
    .order('created_at', { ascending: true })
    .limit(500)
  if (error) {
    console.error('Alert digest: could not read notifications:', error.code, error.message, error.details || '', error.hint || '')
    return res.status(500).json({ error: 'Could not read notifications' })
  }
  if (!rows || rows.length === 0) return res.status(200).json({ ok: true, users: 0, sent: 0 })

  const byUser = new Map()
  for (const r of rows) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, [])
    byUser.get(r.user_id).push(r)
  }
  const userIds = [...byUser.keys()]
  const listingIds = [...new Set(rows.map(r => r.listing_id).filter(Boolean))]

  const [{ data: profiles }, { data: listings }] = await Promise.all([
    supabase.from('profiles').select('id, name, email').in('id', userIds),
    listingIds.length
      ? supabase.from('listings').select('id, address, neighborhood, city, status').in('id', listingIds)
      : Promise.resolve({ data: [] }),
  ])
  console.log('Alert digest: unemailed rows', rows.length, 'users', userIds.length, 'listings', listingIds.length)
  const emailOf = new Map((profiles || []).map(p => [p.id, p]))
  const listingOf = new Map((listings || []).map(l => [l.id, l]))

  const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '')
  const testRecipient = process.env.INQUIRY_TEST_RECIPIENT
  const now = new Date().toISOString()
  let sent = 0, suppressed = 0, failed = 0

  for (const [userId, items] of byUser) {
    const prof = emailOf.get(userId)
    const ids = items.map(i => i.id)

    // Emails follow the save itself (no per-user switch): a renter stops them
    // by unsaving the listing, which stops the notifications too. Only a user
    // with no email address is skipped; their rows are marked handled so the
    // queue does not grow forever.
    if (!prof?.email) {
      await supabase.from('notifications').update({ emailed_at: now }).in('id', ids)
      suppressed += 1
      continue
    }

    // Group this user's rows by listing, in the order the listings first changed.
    const groups = []
    const byListing = new Map()
    for (const r of items) {
      const lid = r.listing_id || 'none'
      if (!byListing.has(lid)) {
        const listing = listingOf.get(r.listing_id) || { id: r.listing_id, address: r.message, status: null }
        const g = { listing, rows: [] }
        byListing.set(lid, g)
        groups.push(g)
      }
      byListing.get(lid).rows.push(r)
    }

    const savedUrl = `${base}/history`
    const { subject, html, text } = renderDigest({ name: prof.name, groups, base, savedUrl })

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Cuna <hello@hellocuna.com>',
        to: [testRecipient || prof.email],
        subject,
        html,
        text,
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
