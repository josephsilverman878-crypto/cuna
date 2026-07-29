import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { ChevronLeft } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      console.error('Password reset request failed:', err)
      toast.error(err.message || 'Could not send reset email')
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
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 600, color: 'var(--terracotta)' }}>
            cuna
          </Link>
          <p style={{ marginTop: '8px', color: 'var(--warm-gray)', fontSize: '15px' }}>
            Reset your password
          </p>
        </div>

        <div className="card" style={{ padding: '36px' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📬</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '8px' }}>
                Check your email
              </h2>
              <p style={{ color: 'var(--warm-gray)', fontSize: '14px', lineHeight: 1.5 }}>
                If an account exists for {email}, we've sent a link to reset your password.
                The link expires in one hour.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: 'var(--warm-gray)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                Enter your email and we'll send you a link to set a new password.
              </p>
              <div>
                <label className="label">Email</label>
                <input
                  type="email" required placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit" className="btn-primary w-full"
                style={{ marginTop: '8px', opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
          <Link to="/login" style={{ color: 'var(--terracotta)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ChevronLeft size={15} /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
