import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Heart, MessageCircle, User, History } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

let matchToastShown = false

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, user } = useAuth()
  const [badgeCount, setBadgeCount] = useState(0)

  useEffect(() => {
    if (profile?.role !== 'renter' || !user) return

    if (location.pathname === '/matches') markMatchesSeen()
    else fetchBadgeCount()

    const interval = setInterval(() => {
      if (location.pathname !== '/matches') fetchBadgeCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [profile, user, location.pathname])

  async function fetchBadgeCount() {
    const { data: myMatches, error } = await supabase
      .from('matches')
      .select('id, seen_by_renter')
      .eq('renter_id', user.id)

    if (error) { console.error('Badge count failed:', error); return }
    if (!myMatches?.length) { setBadgeCount(0); return }

    const matchIds = myMatches.map(m => m.id)

    const { data: unreadMsgs, error: msgError } = await supabase
      .from('messages')
      .select('match_id')
      .in('match_id', matchIds)
      .neq('sender_id', user.id)
      .or('read.is.null,read.eq.false')

    if (msgError) console.error('Unread message check failed:', msgError)

    const needsAttention = new Set((unreadMsgs || []).map(m => m.match_id))
    const newMatches = myMatches.filter(m => !m.seen_by_renter)
    newMatches.forEach(m => needsAttention.add(m.id))

    setBadgeCount(needsAttention.size)

    if (newMatches.length > 0 && !matchToastShown) {
      matchToastShown = true
      toast.success(
        `🎉 You have ${newMatches.length} new match${newMatches.length > 1 ? 'es' : ''}!`,
        { duration: 4000 }
      )
    }
  }

  async function markMatchesSeen() {
    const { error } = await supabase
      .from('matches')
      .update({ seen_by_renter: true })
      .eq('renter_id', user.id)
      .eq('seen_by_renter', false)
    if (error) console.error('Mark matches seen failed:', error)
    fetchBadgeCount()
  }

  const renterTabs = [
    { path: '/swipe', icon: Home, label: 'Discover' },
    { path: '/matches', icon: Heart, label: 'Matches', badge: badgeCount },
    { path: '/history', icon: History, label: 'History' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]
  const posterTabs = [
    { path: '/dashboard', icon: Home, label: 'Listings' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]
  const tabs = profile?.role === 'poster' ? posterTabs : renterTabs

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--white)',
      borderTop: '1px solid var(--sand-dark)',
      display: 'flex',
      padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
      zIndex: 100,
      boxShadow: '0 -4px 20px rgba(44,36,32,0.08)',
    }}>
      {tabs.map(({ path, icon: Icon, label, badge }) => {
        const active = location.pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '4px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '6px 0',
              color: active ? 'var(--terracotta)' : 'var(--warm-gray)',
              transition: 'color 0.2s',
            }}
          >
            <div style={{ position: 'relative', display: 'flex' }}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              {badge > 0 && (
                <span style={{
                  position: 'absolute', top: '-5px', right: '-8px',
                  minWidth: '17px', height: '17px', padding: '0 4px',
                  borderRadius: '9px', background: 'var(--terracotta)',
                  color: 'white', fontSize: '10px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                }}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span style={{ fontSize: '11px', fontWeight: active ? 600 : 400, letterSpacing: '0.3px' }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
