import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Heart, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()

  const renterTabs = [
    { path: '/feed', icon: Home, label: 'Discover' },
    { path: '/history', icon: Heart, label: 'Saved' },
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
      {tabs.map(({ path, icon: Icon, label }) => {
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
