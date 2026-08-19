import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import toast from 'react-hot-toast'
import { LogOut, Save } from 'lucide-react'

// Module scope on purpose. Declared inside Profile() this was a new component
// type on every render, so React unmounted and remounted all four buttons each
// time `form` changed — which drops rapid clicks and steals focus.
function Toggle({ label, value, onToggle }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--sand-dark)' }}>
      <span style={{ fontSize: '14px', color: 'var(--charcoal-soft)' }}>{label}</span>
      <button
        onClick={onToggle}
        style={{
          width: '44px', height: '24px', borderRadius: '12px',
          background: value ? 'var(--terracotta)' : 'var(--warm-gray-light)',
          border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%', background: 'white',
          position: 'absolute', top: '3px',
          left: value ? '23px' : '3px',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  )
}

export default function Profile() {
  const { user, profile, signOut, fetchProfile } = useAuth()
  // Which user's row has already been loaded into `form`, and whether the user
  // has typed since. Refs rather than state: both are read inside an async
  // callback, so they must reflect the value at call time, not at render time.
  const loadedForUser = useRef(null)
  const formDirty = useRef(false)
  const [saving, setSaving] = useState(false)
  const [savingPoster, setSavingPoster] = useState(false)
  const [posterForm, setPosterForm] = useState({
    license_name: '', license_number: '', license_type: '', brokerage_name: '',
  })
  const [form, setForm] = useState({
    move_in_date: '', budget_min: '', budget_max: '',
    bedrooms: '', sqft_min: '', neighborhoods: '',
    credit_score_range: '', has_pets: false, pet_details: '',
    show_phone: false, show_move_in: true, show_pets: true, show_credit: false,
  })

  // Load the renter row exactly ONCE per user. This effect calls setForm(), so
  // every re-run overwrites whatever is on screen — that is how a toggle flipped
  // OFF got written back as true. Narrowing the deps array is NOT sufficient on
  // its own: AuthContext does setProfile(data) with whatever its query returned,
  // so a transient failure makes profile?.role undefined and the next auth event
  // flips it back, which is a real dep change. Guard on identity instead.
  useEffect(() => {
    if (profile?.role !== 'renter' || !user?.id) return
    if (loadedForUser.current === user.id) return
    loadedForUser.current = user.id
    fetchRenterProfile()
  }, [profile?.role, user?.id])

  useEffect(() => {
    if (profile?.role === 'poster') {
      setPosterForm({
        license_name: profile.license_name || '',
        license_number: profile.license_number || '',
        license_type: profile.license_type || '',
        brokerage_name: profile.brokerage_name || '',
      })
    }
  }, [profile])

  async function fetchRenterProfile() {
    const { data } = await supabase
      .from('renter_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (data) {
      // On a slow connection this can resolve after the user has already started
      // typing. Never overwrite unsaved edits.
      if (formDirty.current) return
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

  function update(field, value) {
    formDirty.current = true
    setForm(f => ({ ...f, [field]: value }))
  }
  function updatePoster(field, value) { setPosterForm(f => ({ ...f, [field]: value })) }

  async function savePosterProfile() {
    if (!posterForm.license_name.trim() || !posterForm.license_number.trim() || !posterForm.license_type) {
      toast.error('Licensed name, license number, and license type are required')
      return
    }
    setSavingPoster(true)
    try {
      const { error } = await supabase.from('profiles').update({
        license_name: posterForm.license_name.trim(),
        license_number: posterForm.license_number.trim(),
        license_type: posterForm.license_type,
        brokerage_name: posterForm.brokerage_name.trim() || null,
      }).eq('id', user.id)
      if (error) throw error
      await fetchProfile(user.id)
      toast.success('License details saved — pending review')
    } catch (err) {
      console.error('Poster profile save error:', err)
      toast.error(err.message || 'Failed to save')
    } finally {
      setSavingPoster(false)
    }
  }

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
      formDirty.current = false
      toast.success('Profile saved!')
    } catch (err) {
      console.error('Profile save error:', err)
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

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

        {profile?.role === 'poster' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0 }}>License & verification</h2>
              <span style={{
                fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px',
                background: profile.verified ? 'rgba(74,140,90,0.12)' : 'rgba(155,142,136,0.15)',
                color: profile.verified ? 'var(--like-green)' : 'var(--warm-gray)',
              }}>
                {profile.verified ? '✓ Verified' : 'Pending review'}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--warm-gray)', marginBottom: '20px', lineHeight: 1.5 }}>
              To post listings, you must be registered with the New York Department of State,
              Division of Licensing Services. Cuna may request official documents to confirm
              these details.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Full name as licensed *</label>
                <input placeholder="As it appears on your license" value={posterForm.license_name}
                  onChange={e => updatePoster('license_name', e.target.value)} style={{ marginTop: '6px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">License number *</label>
                  <input placeholder="10401234567" value={posterForm.license_number}
                    onChange={e => updatePoster('license_number', e.target.value)} style={{ marginTop: '6px' }} />
                </div>
                <div>
                  <label className="label">License type *</label>
                  <select value={posterForm.license_type}
                    onChange={e => updatePoster('license_type', e.target.value)} style={{ marginTop: '6px' }}>
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
                <input placeholder="Silverline Realty Group" value={posterForm.brokerage_name}
                  onChange={e => updatePoster('brokerage_name', e.target.value)} style={{ marginTop: '6px' }} />
              </div>

              <button
                className="btn-primary w-full"
                onClick={savePosterProfile}
                style={{ opacity: savingPoster ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={savingPoster}
              >
                <Save size={16} />
                {savingPoster ? 'Saving...' : 'Save license details'}
              </button>
            </div>
          </div>
        )}

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
                    <input type="number" min="0" placeholder="4000" value={form.budget_max}
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
                    <input type="number" min="0" placeholder="600" value={form.sqft_min}
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
              <Toggle label="Share my phone number" value={form.show_phone}
                onToggle={() => update('show_phone', !form.show_phone)} />
              <Toggle label="Share my move-in date" value={form.show_move_in}
                onToggle={() => update('show_move_in', !form.show_move_in)} />
              <Toggle label="Share pet information" value={form.show_pets}
                onToggle={() => update('show_pets', !form.show_pets)} />
              <Toggle label="Share credit score range" value={form.show_credit}
                onToggle={() => update('show_credit', !form.show_credit)} />
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
