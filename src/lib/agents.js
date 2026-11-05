import { supabase } from './supabase'

// Public agent pages (/agent/:id). agent_public() returns one verified
// poster's card and their active and past Cuna listings, or null for anyone
// else. It is callable by anon, so the page works signed out.
export async function getAgentPublic(id) {
  return supabase.rpc('agent_public', { p_id: id })
}

// Bio and owner-verification fields on the poster's own profile row. The
// column grant (46) lets authenticated update exactly these three columns.
export async function saveAgentFields(userId, { bio, owner_property_address, owner_property_bbl }) {
  return supabase
    .from('profiles')
    .update({
      bio: bio?.trim() ? bio.trim().slice(0, 600) : null,
      owner_property_address: owner_property_address?.trim() ? owner_property_address.trim().slice(0, 200) : null,
      owner_property_bbl: /^[1-5][0-9]{9}$/.test(owner_property_bbl || '') ? owner_property_bbl : null,
    })
    .eq('id', userId)
    .select('bio, owner_property_address, owner_property_bbl')
    .maybeSingle()
}

export const LICENSE_TYPE_LABELS = {
  salesperson: 'Licensed real estate salesperson',
  associate_broker: 'Licensed associate real estate broker',
  broker: 'Licensed real estate broker',
  owner: 'Owner',
}
