// Kept so links in emails already sent keep working. Saved-listing emails now
// follow the save itself (there is no per-user switch): this route simply takes
// the visitor to their Saved listings, where unsaving a listing stops its
// updates. Signed-out visitors land on sign-in first and come back to Saved
// listings afterwards (ProtectedRoute passes ?next=).
export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()
  const base = (process.env.PUBLIC_BASE_URL || 'https://hellocuna.com').replace(/\/$/, '')
  res.setHeader('Cache-Control', 'no-store')
  res.writeHead(302, { Location: base + '/history' })
  return res.end()
}
