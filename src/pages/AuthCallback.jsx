import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { safeNextPath } from '../lib/safeNext'

// /auth/callback — where Google / Apple send the browser back. supabase-js
// exchanges the code in the URL for a session on load (PKCE); this page
// only waits for the session and then goes to ?next=. A new user has no
// profile yet, so main.jsx shows CompleteProfile (role + terms) first.
export default function AuthCallback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, loading } = useAuth()
  const [waited, setWaited] = useState(false)
  const next = safeNextPath(params.get('next'))

  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 8000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!loading && user) navigate(next, { replace: true })
  }, [loading, user, next])

  const failed = params.get('error') || params.get('error_description')

  return (
    <div className="center" style={{ height: '100dvh', flexDirection: 'column', gap: '14px', padding: '24px', textAlign: 'center' }}>
      {failed || (waited && !user) ? (
        <>
          <p style={{ color: 'var(--charcoal)', fontWeight: 600 }}>Sign-in did not complete.</p>
          <p style={{ color: 'var(--warm-gray)', fontSize: '13px', maxWidth: '360px' }}>{failed ? String(failed).slice(0, 200) : 'The provider did not send a session back. Try again, or sign in with your email.'}</p>
          <button className="btn-primary" onClick={() => navigate('/login', { replace: true })}>Back to sign in</button>
        </>
      ) : (
        <>
          <div className="spinner" />
          <p style={{ color: 'var(--warm-gray)', fontSize: '13px' }}>Finishing sign-in…</p>
        </>
      )}
    </div>
  )
}
