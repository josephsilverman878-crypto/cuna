import { supabase } from './supabase'

// The log of what Cuna's assistant did for a person (public.ai_actions,
// 49-ai.sql). A row is written only AFTER the person tapped Confirm on a
// confirmation card and the action itself succeeded. The person reads
// their own rows in Profile; nobody else can, and rows are never edited.
//
// kind: 'save_listing' | 'save_search' | 'tour_request'

export async function logAiAction({ kind, listingId = null, savedSearchId = null, summary }) {
  const { error } = await supabase.from('ai_actions').insert({
    kind, listing_id: listingId, saved_search_id: savedSearchId, summary: String(summary || '').slice(0, 300),
  })
  // The action already happened; a missing log table must not undo or hide it.
  if (error && error.code !== 'PGRST205' && error.code !== '42P01') console.error('Assistant activity log failed:', error.code)
  return { error }
}

export async function listAiActions(limit = 50) {
  return supabase.from('ai_actions').select('id, kind, listing_id, summary, created_at').order('created_at', { ascending: false }).limit(limit)
}
