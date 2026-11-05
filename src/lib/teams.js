import { supabase } from './supabase'

// Team accounts (public.brokerages + brokerage_members, 46-wave4-broker-tools.sql).
// One brokerage per owner; a poster belongs to at most one team. The owner
// reads and updates the team's listings through two RLS policies on
// listings; agents see the roster (names) but not each other's listings.

// [{ brokerage_id, brokerage_name, user_id, name, email (owner only), role, added_at, is_owner }]
export async function myTeam() {
  return supabase.rpc('brokerage_team')
}

// The insert policy requires owner_id = auth.uid(), so the caller passes it.
export async function createBrokerageFor(ownerId, name) {
  return supabase
    .from('brokerages')
    .insert({ name: name.trim().slice(0, 120), owner_id: ownerId })
    .select('id, name')
    .single()
}

export async function renameBrokerage(id, name) {
  return supabase.from('brokerages').update({ name: name.trim().slice(0, 120) }).eq('id', id).select('id, name').maybeSingle()
}

// Adds a verified poster by the email they signed up with.
export async function addMember(email) {
  return supabase.rpc('brokerage_add_member', { p_email: email.trim() })
}

export async function removeMember(userId) {
  return supabase.from('brokerage_members').delete().eq('user_id', userId).select('user_id')
}

// Listings posted by the given team members (the owner's RLS policy lets the
// owner read them). Used for the Team tab on the dashboard.
export async function teamListings(memberIds) {
  if (!memberIds.length) return { data: [], error: null }
  return supabase
    .from('listings')
    .select('id, poster_id, address, neighborhood, city, state, price, listing_type, property_type, bedrooms, bathrooms, status, views, created_at, status_changed_at')
    .in('poster_id', memberIds)
    .order('created_at', { ascending: false })
}
