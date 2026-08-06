import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function RegisterPro() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    license_name: '', license_number: '', license_type: '', brokerage_name: '',
  })

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.license_name.trim() || !form.license_number.trim() || !form.license_type) {
      toast.error('Licensed name, license number, and license type are required')
      return
    }
    if (!accepted) { toast.error('Please accept the Terms of Service and Privacy Policy'); return }
    setLoading(true)
    try {
      await signUp({
        name: form.name, email: form.email, phone: form.phone, password: form.password,
        role: 'poster',
        license_name: form.license_name.trim(),
        license_number: form.license_number.trim(),
        license_type: form.license_type,
        brokerage_name: form.brokerage_name.trim() || null,
        accepted_terms_at: new Date().toISOString(),
      })
      toast('🕐 Account created! Your license details are under review — you can post listings once verified.', { duration: 6000 })
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
          <p style={{ marginTop: '8px', color: 'var(--warm-gray)', fontSize: '15px' }}>
            Create your real estate professional account
          </p>
        </div>

        <div className="card" style={{ padding: '36px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="label">Full name *</label>
              <input type="text" required placeholder="Your full name"
                value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Work email *</label>
              <input type="email" required placeholder="you@yourbrokerage.com"
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

            <div style={{ borderTop: '1px solid var(--sand-dark)', paddingTop: '16px', marginTop: '4px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>License details</p>
              <p style={{ fontSize: '12px', color: 'var(--warm-gray)', lineHeight: 1.5, marginBottom: '16px' }}>
                Posters must be registered with the New York Department of State, Division of
                Licensing Services. Your account is activated for posting once these details are
                reviewed. Cuna may request official documents.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="label">Full name as licensed *</label>
                  <input required placeholder="As it appears on your license"
                    value={form.license_name} onChange={e => update('license_name', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="label">License number *</label>
                    <input required placeholder="10401234567"
                      value={form.license_number} onChange={e => update('license_number', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">License type *</label>
                    <select required value={form.license_type}
                      onChange={e => update('license_type', e.target.value)}>
                      <option value="">Select…</option>
                      <option value="salesperson">Salesperson</option>
                      <option value="associate_broker">Associate broker</option>
                      <option value="broker">Broker</option>
                      <option value="owner">Owner (not licensed)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Brokerage</label>
                  <input placeholder="Silverline Realty Group"
                    value={form.brokerage_name} onChange={e => update('brokerage_name', e.target.value)} />
                </div>
              </div>
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
              disabled={loading || !accepted}
            >
              {loading ? 'Creating account...' : 'Create professional account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--sand-dark)' }}>
            <Link to="/register" style={{ color: 'var(--terracotta)', fontSize: '14px', fontWeight: 600 }}>
              ← Looking for a home instead?
            </Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--warm-gray)', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--terracotta)', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
