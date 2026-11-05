import { supabase } from './supabase'

// Market data (wave 5, item 5.2). Two sources, each labelled on the page:
//   - NYC DOF Rolling Sales medians by DOF neighborhood for the last twelve
//     months, through /api/market (server-side SoQL median, 10+ sales only)
//   - What is listed on Cuna right now: medians by neighborhood and type,
//     computed here from the public Active listings, 10+ listings only
// No other numbers: nothing scraped, nothing estimated.

export const MIN_RECORDS = 10

export const DOF_GROUP_LABELS = { houses: '1–3 family houses', coops: 'Co-ops', condos: 'Condos' }

export const BOROUGH_DIGITS = { Manhattan: '1', Bronx: '2', Brooklyn: '3', Queens: '4', 'Staten Island': '5' }
export const BOROUGH_NAMES = { 1: 'Manhattan', 2: 'Bronx', 3: 'Brooklyn', 4: 'Queens', 5: 'Staten Island' }

export async function fetchDofMarket(borough = '') {
  const res = await fetch(`/api/market${borough ? `?borough=${borough}` : ''}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`market ${res.status}`)
  return res.json()
}

// DOF neighborhood names are upper case with hints like "(59-79)". Make
// them readable for the table.
export function prettyDofName(s) {
  return String(s || '').toLowerCase().replace(/\b([a-z])/g, c => c.toUpperCase()).replace(/-([a-z])/g, (m, c) => '-' + c.toUpperCase())
}

export function median(nums) {
  const a = nums.filter(n => Number.isFinite(n)).sort((x, y) => x - y)
  if (!a.length) return null
  const mid = Math.floor(a.length / 2)
  return a.length % 2 ? a[mid] : Math.round((a[mid - 1] + a[mid]) / 2)
}

// { asOf, rows: [{ neighborhood, borough, listing_type, n, median }] } for
// buckets of MIN_RECORDS+ live listings.
export async function cunaListingMedians() {
  const { data, error } = await supabase
    .from('listings')
    .select('neighborhood, city, listing_type, price')
    .eq('status', 'active')
    .limit(5000)
  if (error) throw error
  const buckets = {}
  ;(data || []).forEach(l => {
    if (!l.neighborhood || !l.price) return
    const key = `${l.neighborhood}|${l.city || ''}|${l.listing_type || 'rent'}`
    ;(buckets[key] ||= []).push(Number(l.price))
  })
  const rows = Object.entries(buckets)
    .filter(([, prices]) => prices.length >= MIN_RECORDS)
    .map(([key, prices]) => {
      const [neighborhood, borough, listing_type] = key.split('|')
      return { neighborhood, borough, listing_type, n: prices.length, median: median(prices) }
    })
    .sort((a, b) => a.borough.localeCompare(b.borough) || a.neighborhood.localeCompare(b.neighborhood))
  return { asOf: new Date().toISOString().slice(0, 10), total: (data || []).length, rows }
}
