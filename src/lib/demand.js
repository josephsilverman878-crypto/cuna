import { supabase } from './supabase'

// Demand dashboard for verified posters (demand_buckets(), 46-wave4-broker-tools.sql).
// Counts of saved searches by neighborhood, bedrooms and price band. The
// database keeps only buckets with 3 or more searches and returns no
// identities; nothing about who searches reaches the browser.
export async function demandBuckets() {
  return supabase.rpc('demand_buckets')
}

export function bedsLabel(bedsMin) {
  const n = Number(bedsMin)
  if (n < 0 || Number.isNaN(n)) return 'Any bedrooms'
  if (n === 0) return 'Studio and up'
  return `${n}+ bedroom${n === 1 ? '' : 's'}`
}
