// Builds the saved-listing summary email: subject, HTML and plain text.
// Pure: no env, no network. A leading underscore keeps Vercel from exposing
// this file as a route. Used by api/alerts-digest.js and by the local sample
// renderer in cuna-security/tools (so a sample can be shown without sending).

const STATUS_LABEL = {
  active: 'Active', in_contract: 'In contract', rented: 'Rented',
  off_market: 'Off-market', delisted: 'De-listed',
}
const FIELD_ORDER = ['description', 'photos', 'amenities', 'pet policy', 'size', 'address']
const KIND_ORDER = { status: 0, price: 1, available_date: 2, fees: 3, open_house: 4, details: 5 }

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
))

// One line per change. Several `details` rows on the same listing collapse
// into one line naming every field they covered (the database already keeps
// one such row per saver per listing per day; this is a second guard for the
// email). Other kinds keep their own sentence, oldest first.
export function linesForListing(rows) {
  const sorted = [...rows].sort((a, b) =>
    (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9) || String(a.created_at).localeCompare(String(b.created_at)))
  const lines = []
  const fields = new Set()
  for (const r of sorted) {
    if (r.kind === 'details') {
      for (const f of (r.detail_fields || [])) fields.add(f)
      continue
    }
    lines.push(r.line || r.message)
  }
  if (fields.size) {
    const ordered = FIELD_ORDER.filter(f => fields.has(f)).concat([...fields].filter(f => !FIELD_ORDER.includes(f)))
    lines.push(`The poster updated the listing details (${ordered.join(', ')})`)
  }
  return lines
}

// groups: [{ listing: { id, address, neighborhood, city, status }, rows: [...] }]
export function renderDigest({ name, groups, base, unsubUrl }) {
  const first = (name || '').trim().split(/\s+/)[0]
  const hi = first ? `Hi ${first},` : 'Hi,'
  const count = groups.length
  const subject = 'Updates on homes you saved'
  const intro = count === 1
    ? 'Here is what changed on a home you saved on Cuna.'
    : `Here is what changed on ${count} homes you saved on Cuna.`

  const blocksHtml = groups.map(({ listing, rows }) => {
    const link = `${base}/listing/${listing.id}`
    const where = [listing.neighborhood, listing.city].filter(Boolean).join(', ')
    const status = STATUS_LABEL[listing.status] || ''
    const sub = [where, status && status !== 'Active' ? status : ''].filter(Boolean).join(' · ')
    const items = linesForListing(rows).map(l => `<li style="margin:0 0 6px">${esc(l)}</li>`).join('')
    return `
      <div style="border:1px solid #E8DED2;border-radius:12px;padding:16px 18px;margin:0 0 14px">
        <p style="margin:0 0 2px;font-size:16px;font-weight:700"><a href="${link}" style="color:#2C2420;text-decoration:none">${esc(listing.address)}</a></p>
        ${sub ? `<p style="margin:0 0 10px;font-size:13px;color:#9B8E88">${esc(sub)}</p>` : '<div style="height:8px"></div>'}
        <ul style="padding-left:18px;margin:0 0 12px">${items}</ul>
        <a href="${link}" style="font-size:14px;color:#B44A36;font-weight:600">View listing</a>
      </div>`
  }).join('')

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#2C2420;line-height:1.5">
      <p style="font-size:20px;font-weight:700;color:#B44A36;margin:24px 0 8px">cuna</p>
      <p style="margin:0 0 6px">${esc(hi)}</p>
      <p style="margin:0 0 18px">${esc(intro)}</p>
      ${blocksHtml}
      <p style="margin:18px 0 0;font-size:14px">
        <a href="${base}/feed" style="color:#B44A36">Open Cuna</a> to see everything you saved.
      </p>
      <p style="color:#9B8E88;font-size:12px;margin-top:28px;line-height:1.6">
        You get these summaries because you saved these homes on Cuna; we send one only when something changed, at most twice a day.
        <a href="${unsubUrl}" style="color:#9B8E88">Unsubscribe from saved-listing emails</a> in one click, no sign-in needed,
        or change it any time on your <a href="${base}/profile" style="color:#9B8E88">profile</a>. The bell in the app keeps working either way.<br>
        Cuna LLC · 433 Broadway, New York, NY 10013 · hello@hellocuna.com
      </p>
    </div>`

  const text = [
    hi, '', intro, '',
    ...groups.flatMap(({ listing, rows }) => {
      const where = [listing.neighborhood, listing.city].filter(Boolean).join(', ')
      const status = STATUS_LABEL[listing.status] || ''
      const sub = [where, status && status !== 'Active' ? status : ''].filter(Boolean).join(' · ')
      return [
        listing.address + (sub ? ` (${sub})` : ''),
        ...linesForListing(rows).map(l => `  - ${l}`),
        `  ${base}/listing/${listing.id}`,
        '',
      ]
    }),
    `Open Cuna: ${base}/feed`, '',
    'You get these summaries because you saved these homes on Cuna; we send one only when something changed, at most twice a day.',
    `Unsubscribe (one click, no sign-in): ${unsubUrl}`,
    `Or change it on your profile: ${base}/profile`,
    'The bell in the app keeps working either way.',
    'Cuna LLC · 433 Broadway, New York, NY 10013 · hello@hellocuna.com',
  ].join('\n')

  return { subject, html, text }
}
