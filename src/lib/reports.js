import { supabase } from './supabase'

// Listing reports (public.listing_reports, 44-wave2-listing-page.sql).
// A signed-in user files one; the database trigger allows 5 a day per user
// and one per listing per week. Admins read and resolve through two
// SECURITY DEFINER functions that check is_admin themselves.

export const REPORT_REASONS = [
  { value: 'not_available', label: 'No longer available' },
  { value: 'wrong_price', label: 'Price or fees are wrong' },
  { value: 'wrong_address', label: 'Address or location is wrong' },
  { value: 'duplicate', label: 'Duplicate listing' },
  { value: 'scam', label: 'Looks like a scam' },
  { value: 'discriminatory', label: 'Discriminatory language' },
  { value: 'other', label: 'Something else' },
]

export function reasonLabel(value) {
  return REPORT_REASONS.find(r => r.value === value)?.label || value
}

export async function fileReport(userId, listingId, reason, note) {
  return supabase
    .from('listing_reports')
    .insert({ listing_id: listingId, reporter_id: userId, reason, note: note || null })
    .select('id, status, created_at')
    .single()
}

export async function myReportForListing(userId, listingId) {
  return supabase
    .from('listing_reports')
    .select('id, reason, status, created_at')
    .eq('reporter_id', userId)
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
}

export async function adminListReports(status = 'open') {
  return supabase.rpc('admin_listing_reports', { p_status: status })
}

export async function adminResolveReport(id, note) {
  return supabase.rpc('admin_resolve_report', { p_id: id, p_note: note || null })
}
