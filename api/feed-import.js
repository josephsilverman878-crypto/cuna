// XML listing-feed import: STUB. See docs/xml-feed-design.md.
//
// Off in production: without FEED_IMPORT_ENABLED=true this answers 501 and
// does nothing. With it set, it only parses the <cuna-feed> envelope and
// reports what it would do; it writes no rows and sends no email. The real
// pipeline (fetch on a cron, validate, geocode, upsert by external id) is
// designed in the doc and waits on Joseph's answers (NJ-5).
//
// POST /api/feed-import   body: XML   header: Authorization: Bearer <CRON_SECRET>

export const config = { api: { bodyParser: false } }

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => {
      data += chunk
      if (data.length > 10 * 1024 * 1024) { reject(new Error('feed larger than 10 MB')); req.destroy() }
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (process.env.FEED_IMPORT_ENABLED !== 'true') {
    return res.status(501).json({ error: 'Feed import is not enabled on this deployment' })
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const auth = req.headers.authorization || ''
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  let xml
  try { xml = await readBody(req) } catch (err) { return res.status(413).json({ error: err.message }) }
  if (!/<cuna-feed\b/.test(xml)) return res.status(400).json({ error: 'Not a <cuna-feed> document' })
  const listings = (xml.match(/<listing\b/g) || []).length
  const version = (xml.match(/<cuna-feed[^>]*\bversion="([^"]+)"/) || [])[1] || null
  return res.status(200).json({ ok: true, dry_run: true, version, listings, note: 'Stub: nothing was imported. See docs/xml-feed-design.md.' })
}
