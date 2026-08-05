import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function CompleteProfile() {
  const { user, fetchProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [form, setForm] = useState({ role: '', name: '', phone: '' })

  function update(field, value) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.role) { toast.error('Please select a role'); return }
    if (!accepted) { toast.error('Please accept the Terms of Service and Privacy Policy'); return }
    setLoading(true)
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        name: form.name.trim(),
        email: user.email,
        phone: form.phone.trim(),
        role: form.role,
        accepted_terms_at: new Date().toISOString(),
      })
      if (error) throw error

      if (form.role === 'renter') {
        const { error: renterError } = await supabase
          .from('renter_profiles')
          .upsert({ id: user.id })
        if (renterError) console.error('Renter profile creation failed:', renterError)
      }

      await fetchProfile(user.id)
      toast.success('All set!')
      navigate('/')
    } catch (err) {
      console.error('Profile completion failed:', err)
      toast.error(err.message || 'Could not save profile')
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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 600, color: 'var(--terracotta)' }}>
            cuna
          </div>
          <p style={{ marginTop: '8px', color: 'var(--warm-gray)', fontSize: '15px' }}>
            Finish setting up your account
          </p>
        </div>

        <div className="card" style={{ padding: '36px' }}>
          <p style={{ color: 'var(--warm-gray)', fontSize: '14px', lineHeight: 1.5, marginTop: 0, marginBottom: '24px' }}>
            We just need a few details before you can continue. Signed in as {user?.email}.
          </p>

          <div style={{ marginBottom: '24px' }}>
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
              <label className="label">Cell phone *</label>
              <input type="tel" required placeholder="(555) 000-0000"
                value={form.phone} onChange={e => update('phone', e.target.value)} />
            </div>
            <button
              type="submit" className="btn-primary w-full"
              style={{ marginTop: '8px', opacity: loading ? 0.7 : 1 }}
              disabled={loading || !form.role}
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px' }}>
          <button onClick={signOut} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--warm-gray)', fontSize: '13px',
          }}>
            Sign out
          </button>
        </p>
      </div>
    </div>
  )
}
