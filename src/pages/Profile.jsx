import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import toast from 'react-hot-toast'
import { LogOut, Save } from 'lucide-react'

export default function Profile() {
  const { user, profile, signOut, fetchProfile } = useAuth()
  const [renterProfile, setRenterProfile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    move_in_date: '', budget_min: '', budget_max: '',
    bedrooms: '', sqft_min: '', neighborhoods: '',
    credit_score_range: '', has_pets: false, pet_details: '',
    show_phone: false, show_move_in: true, show_pets: true, show_credit: false,
  })

  useEffect(() => { if (profile?.role === 'renter') fetchRenterProfile() }, [profile])

  async function fetchRenterProfile() {
    const { data } = await supabase
      .from('renter_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (data) {
      setRenterProfile(data)
      setForm({
        move_in_date: data.move_in_date || '',
        budget_min: data.budget_min?.toString() || '',
        budget_max: data.budget_max?.toString() || '',
        bedrooms: data.bedrooms?.toString() || '',
        sqft_min: data.sqft_min?.toString() || '',
        neighborhoods: data.neighborhoods?.join(', ') || '',
        credit_score_range: data.credit_score_range || '',
        has_pets: data.has_pets || false,
        pet_details: data.pet_details || '',
        show_phone: data.show_phone || false,
        show_move_in: data.show_move_in ?? true,
        show_pets: data.show_pets ?? true,
        show_credit: data.show_credit || false,
      })
    }
  }

  function update(field, value) { setForm(f => ({ ...f, [field]: value })) }

  async function saveProfile() {
    setSaving(true)
    try {
      const neighborhoods = form.neighborhoods
        ? form.neighborhoods.split(',').map(n => n.trim()).filter(Boolean)
        : []

      const { error } = await supabase.from('renter_profiles').upsert({
        id: user.id,
        move_in_date: form.move_in_date || null,
        budget_min: form.budget_min ? parseInt(form.budget_min) : null,
        budget_max: form.budget_max ? parseInt(form.budget_max) : null,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        sqft_min: form.sqft_min ? parseInt(form.sqft_min) : null,
        neighborhoods,
        credit_score_range: form.credit_score_range || null,
        has_pets: form.has_pets,
        pet_details: form.pet_details || null,
        show_phone: form.show_phone,
        show_move_in: form.show_move_in,
        show_pets: form.show_pets,
        show_credit: form.show_credit,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      toast.success('Profile saved!')
    } catch (err) {
      console.error('Profile save error:', err)
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const Toggle = ({ field, label }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--sand-dark)' }}>
      <span style={{ fontSize: '14px', color: 'var(--charcoal-soft)' }}>{label}</span>
      <button
        onClick={() => update(field, !form[field])}
        style={{
          width: '44px', height: '24px', borderRadius: '12px',
          background: form[field] ? 'var(--terracotta)' : 'var(--warm-gray-light)',
          border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%', background: 'white',
          position: 'absolute', top: '3px',
          left: form[field] ? '23px' : '3px',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '100px' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)',
        padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 600 }}>Profile</h1>
        <button onClick={signOut} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--pass-red)', fontSize: '14px' }}>
          <LogOut size={16} /> Sign out
        </button>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '16px' }}>Account</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Name', value: profile?.name },
              { label: 'Email', value: profile?.email },
              { label: 'Phone', value: profile?.phone },
              { label: 'Role', value: profile?.role === 'renter' ? 'Renter' : 'Landlord / Agent' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--sand-dark)' }}>
                <span style={{ fontSize: '13px', color: 'var(--warm-gray)', width: '60px', flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: '14px', color: 'var(--charcoal)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {profile?.role === 'renter' && (
          <>
            <div className="card">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '4px' }}>Search preferences</h2>
              <p style={{ fontSize: '12px', color: 'var(--warm-gray)', marginBottom: '20px' }}>Used to find you better matches. Never shown to landlords.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="label">Budget min ($)</label>
                    <input type="number" min="0" placeholder="2000" value={form.budget_min}
                      onChange={e => update('budget_min', e.target.value)} style={{ marginTop: '6px' }} />
                  </div>
                  <div>
                    <label className="label">Budget max ($)</label>
                    <input type="number" placeholder="4000" value={form.budget_max}
                      onChange={e => update('budget_max', e.target.value)} style={{ marginTop: '6px' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="label">Bedrooms needed</label>
                    <input type="number" min="0" placeholder="2" value={form.bedrooms}
                      onChange={e => update('bedrooms', e.target.value)} style={{ marginTop: '6px' }} />
                  </div>
                  <div>
                    <label className="label">Min sq ft</label>
                    <input type="number" placeholder="600" value={form.sqft_min}
                      onChange={e => update('sqft_min', e.target.value)} style={{ marginTop: '6px' }} />
                  </div>
                </div>

                <div>
                  <label className="label">Neighborhoods (comma-separated)</label>
                  <input placeholder="Park Slope, Carroll Gardens, Cobble Hill" value={form.neighborhoods}
                    onChange={e => update('neighborhoods', e.target.value)} style={{ marginTop: '6px' }} />
                </div>
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '4px' }}>Optional info</h2>
              <p style={{ fontSize: '12px', color: 'var(--warm-gray)', marginBottom: '20px' }}>Shown to landlords after matching (based on your privacy settings below).</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="label">Target move-in date</label>
                  <input type="date" value={form.move_in_date}
                    onChange={e => update('move_in_date', e.target.value)} style={{ marginTop: '6px' }} />
                </div>

                <div>
                  <label className="label">Credit score range</label>
                  <select value={form.credit_score_range}
                    onChange={e => update('credit_score_range', e.target.value)} style={{ marginTop: '6px' }}>
                    <option value="">Prefer not to say</option>
                    <option value="750_plus">750+ (Excellent)</option>
                    <option value="700_749">700–749 (Good)</option>
                    <option value="650_699">650–699 (Fair)</option>
                    <option value="600_649">600–649 (Below average)</option>
                    <option value="below_600">Below 600</option>
                  </select>
                </div>

                <div>
                  <label className="label">Pets</label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    {[{ v: false, l: 'No pets' }, { v: true, l: 'I have pets' }].map(({ v, l }) => (
                      <button key={l} type="button" onClick={() => update('has_pets', v)}
                        style={{
                          padding: '8px 16px', borderRadius: '20px', fontSize: '13px',
                          border: `1.5px solid ${form.has_pets === v ? 'var(--terracotta)' : 'var(--warm-gray-light)'}`,
                          background: form.has_pets === v ? 'rgba(196,113,74,0.08)' : 'transparent',
                          color: form.has_pets === v ? 'var(--terracotta)' : 'var(--warm-gray)',
                          cursor: 'pointer',
                        }}>
                        {l}
                      </button>
                    ))}
                  </div>
                  {form.has_pets && (
                    <input placeholder="2 cats, 1 small dog..." value={form.pet_details}
                      onChange={e => update('pet_details', e.target.value)} style={{ marginTop: '10px' }} />
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '4px' }}>Privacy</h2>
              <p style={{ fontSize: '12px', color: 'var(--warm-gray)', marginBottom: '16px' }}>
                Control what landlords can see after you match. Your name and email are always shared.
              </p>
              <Toggle field="show_phone" label="Share my phone number" />
              <Toggle field="show_move_in" label="Share my move-in date" />
              <Toggle field="show_pets" label="Share pet information" />
              <Toggle field="show_credit" label="Share credit score range" />
            </div>

            <button
              className="btn-primary w-full"
              onClick={saveProfile}
              style={{ opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
