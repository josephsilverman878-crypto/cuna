import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
 const [accepted, setAccepted] = useState(false)
  const [form, setForm] = useState({
    role: searchParams.get('role') || '',
    name: '', email: '', phone: '', password: '',
  })

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.role) { toast.error('Please select a role'); return }
    if (!accepted) { toast.error('Please accept the Terms of Service and Privacy Policy'); return }
    setLoading(true)
    try {
      await signUp({ ...form, accepted_terms_at: new Date().toISOString() })
      toast.success('Account created! Welcome to Cuna.')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Sign up failed')
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
      <div style={{ width: '100%', maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 600, color: 'var(--terracotta)' }}>
            cuna
          </Link>
          <p style={{ marginTop: '8px', color: 'var(--warm-gray)', fontSize: '15px' }}>Create your account</p>
        </div>

        <div className="card" style={{ padding: '36px' }}>
          <div style={{ marginBottom: '28px' }}>
            <label className="label">I am a</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
              {[
                { value: 'renter', label: '🔍 Renter', sub: 'Looking for a space' },
                { value: 'poster', label: '🏠 Landlord / Agent', sub: 'Listing a property' },
              ].map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => update('role', r.value)}
                  style={{
                    padding: '16px 12px', borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${form.role === r.value ? 'var(--terracotta)' : 'var(--warm-gray-light)'}`,
                    background: form.role === r.value ? 'rgba(196,113,74,0.06)' : 'var(--white)',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--charcoal)' }}>{r.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--warm-gray)', marginTop: '2px' }}>{r.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="label">Full name *</label>
              <input type="text" required placeholder="Your full name"
                value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" required placeholder="you@example.com"
                value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
            <div>
              <label className="label">Cell phone *</label>
              <input type="tel" required placeholder="(555) 000-0000"
                value={form.phone} onChange={e => update('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">Password *</label>
              <input type="password" required placeholder="At least 8 characters" minLength={8}
                value={form.password} onChange={e => update('password', e.target.value)} />
            </div>

            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              marginTop: '8px', cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                style={{ marginTop: '3px', width: '16px', height: '16px', flexShrink: 0, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', color: 'var(--warm-gray)', lineHeight: 1.5 }}>
                I am 18 or older and agree to Cuna's{' '}
                <Link to="/terms" target="_blank" style={{ color: 'var(--terracotta)', fontWeight: 500 }}>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" style={{ color: 'var(--terracotta)', fontWeight: 500 }}>
                  Privacy Policy
                </Link>.
              </span>
            </label>

            <button
              type="submit" className="btn-primary w-full"
              style={{ marginTop: '8px', opacity: loading ? 0.7 : 1 }}
              disabled={loading || !form.role || !accepted}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--warm-gray)', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--terracotta)', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
