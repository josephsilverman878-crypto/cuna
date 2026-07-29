import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else setInvalid(true)
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Password updated!')
      navigate('/')
    } catch (err) {
      console.error('Password update failed:', err)
      toast.error(err.message || 'Could not update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
      background: 'linear-gradient(160deg, #F5F0E8 0%, #EDE6D6 100%)',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 600, color: 'var(--terracotta)' }}>
            cuna
          </div>
          <p style={{ marginTop: '8px', color: 'var(--warm-gray)', fontSize: '15px' }}>
            Set a new password
          </p>
        </div>

        <div className="card" style={{ padding: '36px' }}>
          {invalid ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '8px' }}>
                Link expired or invalid
              </h2>
              <p style={{ color: 'var(--warm-gray)', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
                Reset links expire after one hour and can only be used once.
              </p>
              <Link to="/forgot-password" className="btn-primary" style={{ display: 'inline-block' }}>
                Request a new link
              </Link>
            </div>
          ) : !ready ? (
            <div className="center" style={{ padding: '20px 0' }}><div className="spinner" /></div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">New password</label>
                <input
                  type="password" required minLength={8} placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <input
                  type="password" required minLength={8} placeholder="Re-enter password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
              </div>
              <button
                type="submit" className="btn-primary w-full"
                style={{ marginTop: '8px', opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
