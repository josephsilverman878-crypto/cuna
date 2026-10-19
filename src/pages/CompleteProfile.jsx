import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
      // A plain INSERT, deliberately not an upsert.
      //
      // PostgREST compiles `.upsert()` into
      //   INSERT ... ON CONFLICT (id) DO UPDATE SET <every payload column>
      // and Postgres checks UPDATE privilege on every column in that SET list
      // when it plans the statement -- whether or not any row actually
      // conflicts. Stage 2c narrows the `authenticated` UPDATE grant on
      // profiles to exclude id, email, role and accepted_terms_at, so the
      // upsert form would fail with 42501 on EVERY submit once 2c lands, not
      // just on a conflict. A plain INSERT needs only INSERT privilege on the
      // columns it names, which 2c grants, so this works before and after.
      //
      // `role` stays in the payload. This page renders only when there is no
      // profile row (src/main.jsx:41), so this is an insert, the guard allows
      // role on insert, and these users have no signup metadata for
      // handle_new_user to have read -- which is exactly why they have no row.
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        name: form.name.trim(),
        email: user.email,
        phone: form.phone.trim(),
        role: form.role,
        accepted_terms_at: new Date().toISOString(),
      })
      // 23505 unique_violation means the row already exists, which is a
      // success for this page, not a failure: it means CompleteProfile was
      // shown to someone who DOES have a profile. That happens in the ~400ms
      // window after sign-in while fetchProfile is still in flight and
      // main.jsx:41 sees `user && !profile` (followup 10). Their row is
      // already correct -- load it and carry on rather than showing them an
      // error for a race they did not cause.
      const alreadyExisted = error?.code === '23505'
      if (error && !alreadyExisted) throw error

      // Only when WE created the profile row. If it already existed, so does
      // whatever renter_profiles row belongs with it -- handle_new_user
      // creates the pair together, and an earlier submit of this form would
      // have too. Re-running the upsert in that case would be a write on
      // behalf of someone whose setup is already finished, during a race they
      // did not cause. Nothing needs repairing, so nothing is written.
      if (!alreadyExisted && form.role === 'renter') {
        const { error: renterError } = await supabase
          .from('renter_profiles')
          .upsert({ id: user.id }, { onConflict: 'id' })
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
