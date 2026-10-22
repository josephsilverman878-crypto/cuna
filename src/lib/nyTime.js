// New York wall-clock helpers. No imports, so this file is testable in plain
// Node (tests/nyTime.test.mjs) and safe to use from any page.
//
// Open-house times are typed as New York times and shown as New York times,
// whatever the clock of the computer entering or viewing them. The only
// trustworthy way to do that is to convert explicitly through the
// America/New_York zone, DST included -- never through `new Date(local)`.

export const NY_TZ = 'America/New_York'

const PAD = n => String(n).padStart(2, '0')

// The wall-clock parts of an instant as New York sees it.
export function nyParts(date) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: NY_TZ, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const p = Object.fromEntries(dtf.formatToParts(date).filter(x => x.type !== 'literal').map(x => [x.type, parseInt(x.value, 10)]))
  return { year: p.year, month: p.month, day: p.day, hour: p.hour === 24 ? 0 : p.hour, minute: p.minute, second: p.second }
}

// New York's offset from UTC at a given instant, in ms (negative: NY is behind UTC).
function nyOffsetMs(instant) {
  const p = nyParts(instant)
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - instant.getTime()
}

// 'YYYY-MM-DD' + 'HH:MM' read as a New York wall clock -> ISO instant (UTC).
// Returns null for anything it cannot parse.
export function nyWallClockToIso(dateStr, timeStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '')
  const t = /^(\d{2}):(\d{2})/.exec(timeStr || '')
  if (!m || !t) return null
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +t[1], +t[2])   // the wall clock, pretending it were UTC
  let instant = guess - nyOffsetMs(new Date(guess))
  // Around a DST switch the first guess can land on the wrong side; one
  // correction with the offset at the corrected instant settles it.
  const off2 = nyOffsetMs(new Date(instant))
  if (guess - off2 !== instant) instant = guess - off2
  const d = new Date(instant)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

// ISO instant -> { date: 'YYYY-MM-DD', time: 'HH:MM' } on the New York clock,
// for filling <input type="date"> and <input type="time">.
export function isoToNyFields(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { date: '', time: '' }
  const p = nyParts(d)
  return { date: `${p.year}-${PAD(p.month)}-${PAD(p.day)}`, time: `${PAD(p.hour)}:${PAD(p.minute)}` }
}

// "Sat, Oct 24 · 12:00–1:30 PM"
export function formatOpenHouse(startsAt, endsAt) {
  const s = new Date(startsAt), e = new Date(endsAt)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return ''
  const day = s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: NY_TZ })
  const t1 = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: NY_TZ })
  const t2 = e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: NY_TZ })
  const samePeriod = t1.slice(-2) === t2.slice(-2)
  return `${day} · ${samePeriod ? t1.slice(0, -3) : t1}–${t2}`
}

// "Open house Sat"
export function openHouseDayTag(startsAt) {
  const s = new Date(startsAt)
  if (Number.isNaN(s.getTime())) return ''
  return `Open house ${s.toLocaleDateString('en-US', { weekday: 'short', timeZone: NY_TZ })}`
}

export function isUpcoming(slot) {
  return Boolean(slot) && !slot.cancelled_at && new Date(slot.ends_at).getTime() > Date.now()
}
