import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMyNotifications, getUnreadCount, markAllRead, markRead, timeAgo } from '../lib/notifications'

// Header bell for signed-in users: unread count, newest-first dropdown, each
// row links to its listing, "Mark all read". Rows come from the notifications
// table, which only database triggers write; see src/lib/notifications.js.
export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getUnreadCount(user.id).then(({ count }) => { if (!cancelled) setUnread(count) })
    return () => { cancelled = true }
  }, [user?.id])

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next && user) {
      setLoading(true)
      const { data, error } = await getMyNotifications(user.id)
      if (error) console.error('Notifications fetch failed:', error)
      setItems(data || [])
      setLoading(false)
    }
  }

  async function handleMarkAll() {
    const { error } = await markAllRead(user.id)
    if (error) { console.error('Mark all read failed:', error); return }
    setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
    setUnread(0)
  }

  async function openItem(n) {
    if (!n.read_at) {
      markRead(user.id, n.id)
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
      setUnread(c => Math.max(0, c - 1))
    }
    setOpen(false)
    if (n.listing_id) navigate('/listing/' + n.listing_id)
  }

  if (!user) return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
          color: 'var(--charcoal)', display: 'flex', position: 'relative',
        }}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0, minWidth: '16px', height: '16px',
            borderRadius: '8px', background: 'var(--terracotta)', color: 'white',
            fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 190 }} />
          <div style={{
            position: 'absolute', right: 0, top: '38px', zIndex: 191, width: 'min(340px, calc(100vw - 32px))',
            background: 'var(--white)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--sand-dark)', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderBottom: '1px solid var(--sand-dark)',
            }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Notifications</span>
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={unread === 0}
                style={{
                  background: 'none', border: 'none', cursor: unread === 0 ? 'default' : 'pointer',
                  fontSize: '12px', fontWeight: 600, color: unread === 0 ? 'var(--warm-gray)' : 'var(--terracotta)',
                }}
              >
                Mark all read
              </button>
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {loading ? (
                <p style={{ padding: '16px 14px', fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>Loading…</p>
              ) : items.length === 0 ? (
                <p style={{ padding: '16px 14px', fontSize: '13px', color: 'var(--warm-gray)', margin: 0, lineHeight: 1.5 }}>
                  Nothing yet. Save a listing and you'll hear about status changes, price changes and open houses here.
                </p>
              ) : items.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openItem(n)}
                  style={{
                    display: 'flex', gap: '10px', width: '100%', textAlign: 'left', cursor: 'pointer',
                    padding: '10px 14px', border: 'none', borderBottom: '1px solid var(--sand-dark)',
                    background: n.read_at ? 'var(--white)' : 'rgba(180,74,54,0.05)',
                  }}
                >
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '6px',
                    background: n.read_at ? 'transparent' : 'var(--terracotta)',
                  }} />
                  <span style={{ flex: 1, fontSize: '13px', lineHeight: 1.45, color: 'var(--charcoal)' }}>{n.message}</span>
                  <span style={{ fontSize: '11px', color: 'var(--warm-gray)', flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
