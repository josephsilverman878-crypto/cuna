// Listing status vocabulary, shared by the poster screens, the feed and the
// public listing page. The database CHECK (33-listing-status.sql) allows exactly
// these five values; anything else is rejected with 23514.
//
// Posters may move a listing between any of them at any time, including back
// to active. Posters can never delete a listing. Only PUBLIC_STATUSES appear in
// the feed, search and quiz results; every listing stays viewable at its own
// link in any status through get_listing_public().

export const LISTING_STATUSES = [
  { id: 'active',      label: 'Active',      short: 'Active' },
  { id: 'in_contract', label: 'In contract', short: 'In contract' },
  { id: 'rented',      label: 'Rented',      short: 'Rented' },
  { id: 'off_market',  label: 'Off-market',  short: 'Off-market' },
  { id: 'delisted',    label: 'De-listed',   short: 'De-listed' },
]

export const PUBLIC_STATUSES = ['active', 'in_contract']

export function statusLabel(id) {
  return LISTING_STATUSES.find(s => s.id === id)?.label || id || ''
}

export function isPublicStatus(status) {
  return PUBLIC_STATUSES.includes(status)
}

// 4/7/2026
export function formatShortDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

// 4/6/26
export function formatTinyDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`
}

// "↑ $200" / "↓ $200"
export function formatPriceDelta(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n) || n === 0) return ''
  return `${n > 0 ? '↑' : '↓'} $${Math.abs(n).toLocaleString()}`
}

export function withinDays(iso, days) {
  if (!iso) return false
  const t = new Date(iso).getTime()
  return Number.isFinite(t) && Date.now() - t <= days * 86400000
}

// Gray badge under the price on the public page, non-active statuses only.
// "Rented 4/7/2026", "In contract 4/7/2026", "Off-market 4/7/2026", "De-listed 4/7/2026"
export function statusBadge(listing) {
  if (!listing || listing.status === 'active') return null
  const date = formatShortDate(listing.status_changed_at)
  return `${statusLabel(listing.status)}${date ? ' ' + date : ''}`
}

// The first box of the stats row: label + value, status-specific.
export function availabilityBox(listing) {
  const date = formatShortDate(listing?.status_changed_at)
  switch (listing?.status) {
    case 'active':
      return { label: 'Available', value: 'Available now' }
    case 'in_contract':
      return { label: 'Available', value: date ? `In contract since ${date}` : 'In contract' }
    case 'rented':
      return { label: 'Unavailable', value: date ? `Rented on ${date}` : 'Rented' }
    case 'off_market':
      return { label: 'Unavailable', value: date ? `Off-market since ${date}` : 'Off-market' }
    case 'delisted':
      return { label: 'Unavailable', value: date ? `De-listed ${date}` : 'De-listed' }
    default:
      return { label: 'Availability', value: '—' }
  }
}

// "↑ $200 (+3.4%) on 4/6/26" or "—"
export function lastPriceChangeText(change) {
  if (!change || !Number.isFinite(Number(change.amount)) || Number(change.amount) === 0) return '—'
  const pct = change.percent === null || change.percent === undefined
    ? ''
    : ` (${Number(change.percent) > 0 ? '+' : ''}${Number(change.percent).toFixed(1)}%)`
  return `${formatPriceDelta(change.amount)}${pct} on ${formatTinyDate(change.date)}`
}
