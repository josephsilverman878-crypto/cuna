// Run with any process time zone -- the point is that the answers do not move:
//   TZ=Asia/Tokyo node --test tests/nyTime.test.mjs
//   TZ=America/Los_Angeles node --test tests/nyTime.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { nyWallClockToIso, isoToNyFields, formatOpenHouse, openHouseDayTag } from '../src/lib/nyTime.js'

const here = process.env.TZ || 'system default'

test(`poster in ${here} enters 12:00 PM on Oct 24 -> stored as 16:00Z (EDT) and shown as 12:00 PM New York`, () => {
  const iso = nyWallClockToIso('2026-10-24', '12:00')
  assert.equal(iso, '2026-10-24T16:00:00.000Z')
  const end = nyWallClockToIso('2026-10-24', '13:30')
  assert.equal(end, '2026-10-24T17:30:00.000Z')
  assert.equal(formatOpenHouse(iso, end), 'Sat, Oct 24 · 12:00–1:30 PM')
  assert.equal(openHouseDayTag(iso), 'Open house Sat')
})

test('winter: 12:00 PM on Jan 15 -> 17:00Z (EST)', () => {
  assert.equal(nyWallClockToIso('2026-01-15', '12:00'), '2026-01-15T17:00:00.000Z')
})

test('DST switch days land on the right side', () => {
  assert.equal(nyWallClockToIso('2026-03-08', '12:00'), '2026-03-08T16:00:00.000Z') // EDT begins 2am that day
  assert.equal(nyWallClockToIso('2026-11-01', '12:00'), '2026-11-01T17:00:00.000Z') // EST begins 2am that day
  assert.equal(nyWallClockToIso('2026-03-08', '01:30'), '2026-03-08T06:30:00.000Z') // still EST before the switch
})

test('editing round-trips through New York fields, not the local clock', () => {
  const iso = nyWallClockToIso('2026-10-24', '12:00')
  assert.deepEqual(isoToNyFields(iso), { date: '2026-10-24', time: '12:00' })
  assert.deepEqual(isoToNyFields('2026-01-15T17:00:00.000Z'), { date: '2026-01-15', time: '12:00' })
})

test('garbage in -> null, not a surprise date', () => {
  assert.equal(nyWallClockToIso('', '12:00'), null)
  assert.equal(nyWallClockToIso('2026-10-24', ''), null)
  assert.equal(nyWallClockToIso('24/10/2026', '12:00'), null)
})
