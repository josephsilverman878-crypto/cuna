import { supabase } from './supabase'

// In-app alerts (notifications table, 34-saved-alerts.sql). Rows are created
// only by database triggers for renters who saved a listing. The client can
// read its own rows and set read_at on them -- nothing else, by grant.

export async function getMyNotifications(userId, limit = 30) {
  return supabase
    .from('notifications')
    .select('id, listing_id, kind, message, created_at, read_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
}

export async function getUnreadCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)
  return { count: count || 0, error }
}

export async function markAllRead(userId) {
  return supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)
}

export async function markRead(userId, id) {
  return supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', id)
    .is('read_at', null)
}

// "2m", "3h", "4d"
export function timeAgo(iso) {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}
