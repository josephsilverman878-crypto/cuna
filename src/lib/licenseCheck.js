// Brokerage verification against NY DOS's public "Active Real Estate
// Licensees" dataset on data.ny.gov (yg7h-zjbf). Read-only, no key, run in
// the admin's browser. The result is a comparison for Joseph to look at; it
// never approves anyone by itself.
//
// Dataset fields (checked 2026-11-05): license_number, license_holder_name
// ("LAST FIRST M"), business_name, license_type ("SALESPERSON", "BROKER",
// "ASSOCIATE BROKER" ...), license_expiration_date, business_city.

const DATASET = 'https://data.ny.gov/resource/yg7h-zjbf.json'

const TYPE_WORDS = {
  salesperson: ['SALESPERSON'],
  associate_broker: ['ASSOCIATE BROKER'],
  broker: ['BROKER'],
}

function tokens(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').split(/\s+/).filter(t => t.length > 1)
}

// Two names match when every token of the shorter one appears in the longer
// one, ignoring order ("JANE Q PUBLIC" vs "PUBLIC JANE"). Middle initials are
// single letters and are dropped by tokens().
function namesMatch(a, b) {
  const ta = tokens(a), tb = tokens(b)
  if (!ta.length || !tb.length) return false
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta]
  return short.every(t => long.includes(t))
}

function typeMatches(wanted, actual) {
  const words = TYPE_WORDS[wanted]
  const a = String(actual || '').toUpperCase()
  if (!words) return null
  if (wanted === 'broker') return a.includes('BROKER') && !a.includes('ASSOCIATE')
  return words.some(w => a.includes(w))
}

export async function lookupLicense(licenseNumber) {
  const n = String(licenseNumber || '').trim().toUpperCase()
  if (!n) return []
  const url = `${DATASET}?license_number=${encodeURIComponent(n)}&$limit=5`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`data.ny.gov answered ${res.status}`)
  return res.json()
}

// profile: { license_name, license_number, license_type, brokerage_name }
// Returns { found, rows, checks: [{ label, ok, ours, theirs }], verdict }.
export async function compareLicense(profile) {
  if (profile.license_type === 'owner') {
    return { found: false, rows: [], checks: [], verdict: 'owner', note: 'Owner accounts are not licensed. Use the owner check instead.' }
  }
  const rows = await lookupLicense(profile.license_number)
  if (!rows.length) {
    return { found: false, rows: [], checks: [], verdict: 'not_found', note: 'No active NY DOS license with this number. The dataset lists active licensees only; a lapsed or brand-new license may be missing.' }
  }
  const r = rows[0]
  const expires = r.license_expiration_date ? new Date(r.license_expiration_date) : null
  const checks = [
    { label: 'Name', ok: namesMatch(profile.license_name, r.license_holder_name), ours: profile.license_name, theirs: r.license_holder_name },
    { label: 'License type', ok: typeMatches(profile.license_type, r.license_type), ours: profile.license_type, theirs: r.license_type },
    { label: 'Brokerage', ok: profile.brokerage_name ? namesMatch(profile.brokerage_name, r.business_name) : null, ours: profile.brokerage_name || '(none given)', theirs: r.business_name },
    { label: 'Expires', ok: expires ? expires.getTime() > Date.now() : null, ours: '', theirs: expires ? expires.toLocaleDateString() : '(unknown)' },
  ]
  const hard = checks.filter(c => c.label !== 'Brokerage')
  const verdict = hard.every(c => c.ok === true) ? (checks[2].ok === false ? 'partial' : 'match') : 'mismatch'
  return { found: true, rows, checks, verdict }
}
