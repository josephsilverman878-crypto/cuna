import { supabase } from './supabase'

// The lead inbox: every tour request and question on the poster's own
// listings, with a status the poster sets (46-wave4-broker-tools.sql).
// Reads go through poster_inquiry_contacts() (SECURITY DEFINER, pinned to
// auth.uid()); the only poster-side write on inquiries is the status pair,
// which the column grant and RLS policy limit to the listing's poster.

export const LEAD_STATUSES = [
  { id: 'new', label: 'New' },
  { id: 'replied', label: 'Replied' },
  { id: 'toured', label: 'Toured' },
  { id: 'closed', label: 'Closed' },
]

export function leadStatusLabel(id) {
  return LEAD_STATUSES.find(s => s.id === id)?.label || id
}

export async function fetchLeads() {
  return supabase.rpc('poster_inquiry_contacts')
}

export async function setLeadStatus(inquiryId, status) {
  return supabase
    .from('inquiries')
    .update({ status, status_changed_at: new Date().toISOString() })
    .eq('id', inquiryId)
    .select('id, status, status_changed_at')
    .maybeSingle()
}

// The email thread. send-inquiry.js writes the subject "Tour request: <address>"
// or "Question about <address>" and sets Reply-To to the renter, so a reply
// from the poster's mail app lands in the same thread. This link opens a
// reply with the same subject in case the original email is gone.
export function mailtoFor(lead, address) {
  if (!lead?.renter_email) return null
  const what = lead.kind === 'question' ? 'Question about' : 'Tour request:'
  const subject = `Re: ${what} ${address || 'your listing'}`
  return `mailto:${encodeURIComponent(lead.renter_email)}?subject=${encodeURIComponent(subject)}`
}
