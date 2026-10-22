// One-click unsubscribe from saved-listing alert emails. No sign-in: the link
// carries a signed token (see _alerts-token.js). Flips
// renter_profiles.alert_emails to false for that user and nothing else.
// Accepts GET (link in the email) and POST (RFC 8058 List-Unsubscribe-Post).
import { createClient } from '@supabase/supabase-js'
import { verifyUnsubscribeToken } from './_alerts-token.js'

const page = (title, body) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:Arial,sans-serif;background:#F6EFE6;color:#2C2420;margin:0;padding:48px 24px"><div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:28px">
<h1 style="color:#B44A36;font-size:22px;margin:0 0 12px">${title}</h1><p style="line-height:1.6;margin:0">${body}</p></div></body></html>`

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()
  const token = (req.query && req.query.t) || (req.body && req.body.t)
  const secret = process.env.ALERT_UNSUBSCRIBE_SECRET
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret || !url || !key) return res.status(500).send(page('Something went wrong', 'This link cannot be processed right now.'))

  const userId = verifyUnsubscribeToken(token, secret)
  if (!userId) return res.status(400).send(page('This link is not valid', 'The unsubscribe link is missing or has been altered. You can also turn off saved-listing emails in your Cuna profile.'))

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const { error } = await supabase.from('renter_profiles').update({ alert_emails: false }).eq('id', userId)
  if (error) return res.status(500).send(page('Something went wrong', 'We could not update your setting. Please try again or change it in your Cuna profile.'))
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  return res.status(200).send(page("You're unsubscribed", 'You will no longer get emails about listings you saved. The bell in the app still shows them, and you can turn emails back on in your profile any time.'))
}
