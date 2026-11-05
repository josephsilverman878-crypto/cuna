import { supabase } from './supabase'

// Suspicious-listing flags (public.listing_flags, 46-wave4-broker-tools.sql).
// The database writes them from a trigger when a listing goes live with a
// price under half the area median (5+ comparable live listings) or a photo
// already used by another poster. Admins list and resolve them through two
// SECURITY DEFINER functions that check is_admin themselves.

export const FLAG_KINDS = {
  low_price: 'Price far below the area',
  reused_photos: 'Photos reused from another poster',
}

export function flagLabel(kind) {
  return FLAG_KINDS[kind] || kind
}

export async function adminListFlags(open = true) {
  return supabase.rpc('admin_listing_flags', { p_open: open })
}

export async function adminResolveFlag(id, note) {
  return supabase.rpc('admin_resolve_flag', { p_id: id, p_note: note || null })
}

// The unique index listings_one_live_per_address_idx refuses a second
// Active / In-contract listing at the same address line (unit included).
export function isDuplicateAddressError(error) {
  return error?.code === '23505' && /listings_one_live_per_address_idx/.test(error.message || '')
}

export const DUPLICATE_ADDRESS_MESSAGE =
  'A live listing already exists on Cuna for this address and unit. If it is yours, edit that listing instead of posting it again.'
