import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import toast from 'react-hot-toast'
import { Link2, Loader, ChevronLeft, ImagePlus, X, Upload, ChevronRight } from 'lucide-react'

const TABS = ['Details', 'Costs & Fees', 'Amenities', 'Photos', 'Review']

const EMPTY_FORM = {
  source_url: '', source_platform: 'manual',
  address: '', city: '', state: 'NY', neighborhood: '', zip_code: '',
  price: '', bedrooms: '', bathrooms: '', sqft: '',
  description: '', available_date: '',
  // costs & fees
  security_deposit: '', application_fee: '', move_in_fee: '', other_fees: [],
  // amenities as booleans
  doorman: false, elevator: false, gym: false, laundry: false,
  dishwasher: false, hardwood: false, pets: false, roof_deck: false,
  central_air: false, washer_dryer: false, parking: false, storage: false,
}

export default function PostListing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [form, setForm] = useState(EMPTY_FORM)
  const [scraping, setScraping] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [photos, setPhotos] = useState([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef()

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleAmenity(key) {
    setForm(f => ({ ...f, [key]: !f[key] }))
  }

  // ── OTHER FEES (dynamic list) ─────────────────────────────────
  function addOtherFee() {
    setForm(f => ({ ...f, other_fees: [...f.other_fees, { description: '', amount: '' }] }))
  }

  function updateOtherFee(i, field, value) {
    setForm(f => {
      const next = [...f.other_fees]
      next[i] = { ...next[i], [field]: value }
      return { ...f, other_fees: next }
    })
  }

  function removeOtherFee(i) {
    setForm(f => ({ ...f, other_fees: f.other_fees.filter((_, idx) => idx !== i) }))
  }

  function totalDueAtSigning() {
    const rent = parseInt(form.price) || 0
    const deposit = parseInt(form.security_deposit) || 0
    const appFee = parseInt(form.application_fee) || 0
    const moveIn = parseInt(form.move_in_fee) || 0
    const other = form.other_fees.reduce((sum, f) => sum + (parseInt(f.amount) || 0), 0)
    return rent + deposit + appFee + moveIn + other
  }

  // ── PHOTO HANDLING ──────────────────────────────────────────
  function addFiles(files) {
    const remaining = 10 - photos.length
    if (remaining <= 0) { toast.error('Maximum 10 photos'); return }
    const toAdd = Array.from(files).slice(0, remaining)
    const newPhotos = toAdd.map(file => ({ file, preview: URL.createObjectURL(file) }))
    setPhotos(prev => [...prev, ...newPhotos])
  }

  function removePhoto(i) {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[i].preview)
      return prev.filter((_, idx) => idx !== i)
    })
  }

  function onDragOver(e) { e.preventDefault(); setDragging(true) }
  function onDragLeave() { setDragging(false) }
  function onDrop(e) {
    e.preventDefault(); setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  async function uploadPhotos(listingId) {
    if (!photos.length) return []
    const urls = []
    for (let i = 0; i < photos.length; i++) {
      setUploadProgress(`Uploading photo ${i + 1} of ${photos.length}…`)
      const { file } = photos[i]
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${listingId}/${Date.now()}-${i}.${ext}`
      const { error } = await supabase.storage
        .from('listing-photos')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) throw error
      const { data } = supabase.storage.from('listing-photos').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    setUploadProgress('')
    return urls
  }

  // ── URL SCRAPER ──────────────────────────────────────────────
  async function scrapeUrl() {
    if (!urlInput.trim()) return
    setScraping(true)
    try {
      const platform = urlInput.includes('streeteasy') ? 'streeteasy'
        : urlInput.includes('zillow') ? 'zillow' : 'manual'
      let pageContent = ''
      try {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(urlInput)}`)
        const data = await res.json()
        pageContent = data.contents?.substring(0, 8000) || ''
      } catch { pageContent = `URL: ${urlInput}` }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-calls': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: `Extract rental listing details and return ONLY JSON:
{
  "address":"","city":"","state":"","neighborhood":"","zip_code":"",
  "price":null,"bedrooms":null,"bathrooms":null,"sqft":null,
  "description":"","available_date":null
}
URL: ${urlInput}
Page: ${pageContent}
Return ONLY the JSON.` }],
        }),
      })
      const data = await response.json()
      const parsed = JSON.parse(data.content?.[0]?.text?.replace(/```json|```/g, '').trim() || '{}')
      setForm(f => ({
        ...f,
        source_url: urlInput, source_platform: platform,
        address: parsed.address || f.address,
        city: parsed.city || f.city,
        state: parsed.state || f.state,
        neighborhood: parsed.neighborhood || f.neighborhood,
        zip_code: parsed.zip_code || f.zip_code,
        price: parsed.price?.toString() || f.price,
        bedrooms: parsed.bedrooms?.toString() || f.bedrooms,
        bathrooms: parsed.bathrooms?.toString() || f.bathrooms,
        sqft: parsed.sqft?.toString() || f.sqft,
        description: parsed.description || f.description,
        available_date: parsed.available_date || f.available_date,
      }))
      toast.success('Details imported — review below')
    } catch (err) {
      console.error(err)
      toast.error('Could not import — fill in manually')
    } finally { setScraping(false) }
  }

  // ── SUBMIT ────────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitting(true)
    try {
      const amenitiesArray = Object.entries({
        doorman: 'Doorman', elevator: 'Elevator', gym: 'Gym',
        laundry: 'Laundry', dishwasher: 'Dishwasher', hardwood: 'Hardwood floors',
        pets: 'Pets allowed', roof_deck: 'Roof deck', central_air: 'Central air',
        washer_dryer: 'Washer/dryer', parking: 'Parking', storage: 'Storage',
      }).filter(([k]) => form[k]).map(([, v]) => v)

      const { data: listing, error: insertError } = await supabase
        .from('listings')
        .insert({
          poster_id: user.id,
          source_url: form.source_url || null,
          source_platform: form.source_platform,
          address: form.address,
          city: form.city,
          state: form.state,
          neighborhood: form.neighborhood || null,
          zip_code: form.zip_code || null,
          price: parseInt(form.price),
          bedrooms: parseInt(form.bedrooms),
          bathrooms: parseFloat(form.bathrooms),
          sqft: form.sqft ? parseInt(form.sqft) : null,
          description: form.description || null,
          security_deposit: form.security_deposit ? parseInt(form.security_deposit) : null,
          application_fee: form.application_fee ? parseInt(form.application_fee) : null,
          move_in_fee: form.move_in_fee ? parseInt(form.move_in_fee) : null,
          other_fees: form.other_fees
            .filter(f => f.description && f.amount)
            .map(f => ({ description: f.description, amount: parseInt(f.amount) })),
          amenities: amenitiesArray,
          available_date: form.available_date || null,
          status: 'active',
          photos: [],
        })
        .select()
        .single()

      if (insertError) throw insertError

      if (photos.length > 0) {
        const photoUrls = await uploadPhotos(listing.id)
        const { error: updateError } = await supabase
          .from('listings').update({ photos: photoUrls }).eq('id', listing.id)
        if (updateError) throw updateError
      }

      toast.success('Listing posted!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Failed to post listing')
    } finally {
      setSubmitting(false)
      setUploadProgress('')
    }
  }

  // ── VALIDATION per tab ───────────────────────────────────────
  function canAdvance() {
    if (tab === 0) return form.address && form.city && form.state && form.price && form.bedrooms && form.bathrooms
    return true
  }

  // ── STYLES ───────────────────────────────────────────────────
  const inputStyle = { marginTop: '6px' }
  const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }

  const amenityBtn = (key, label) => (
    <button
      key={key}
      type="button"
      onClick={() => toggleAmenity(key)}
      style={{
        padding: '10px 14px',
        borderRadius: '10px',
        border: `2px solid ${form[key] ? 'var(--terracotta)' : 'var(--sand-dark)'}`,
        background: form[key] ? 'rgba(180,74,54,0.08)' : 'var(--white)',
        color: form[key] ? 'var(--terracotta)' : 'var(--warm-gray)',
        fontWeight: form[key] ? 600 : 400,
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        textAlign: 'left',
      }}
    >
      {label}
    </button>
  )

  // ── RENDER TABS ──────────────────────────────────────────────
  const tabContent = [

    // ── TAB 0: DETAILS ──
    <div key="details" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* URL import */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Link2 size={16} color="var(--terracotta)" />
          <span style={{ fontWeight: 600, fontSize: '15px' }}>Import from URL</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--warm-gray)', marginBottom: '12px' }}>
          Paste a StreetEasy or Zillow URL to auto-fill details.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="url" placeholder="https://streeteasy.com/..."
            value={urlInput} onChange={e => setUrlInput(e.target.value)} style={{ flex: 1 }} />
          <button onClick={scrapeUrl} disabled={scraping || !urlInput.trim()} className="btn-primary"
            style={{ whiteSpace: 'nowrap', opacity: scraping ? 0.7 : 1, padding: '12px 18px' }}>
            {scraping ? <Loader size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Import'}
          </button>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', margin: 0 }}>Location</h3>

        <div>
          <label className="label">Street address *</label>
          <input required placeholder="123 Main St, Apt 4B" value={form.address}
            onChange={e => update('address', e.target.value)} style={inputStyle} />
        </div>

        <div style={rowStyle}>
          <div>
            <label className="label">City *</label>
            <input required placeholder="New York" value={form.city}
              onChange={e => update('city', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="label">State *</label>
            <input required placeholder="NY" maxLength={2} value={form.state}
              onChange={e => update('state', e.target.value.toUpperCase())} style={inputStyle} />
          </div>
        </div>

        <div style={rowStyle}>
          <div>
            <label className="label">Neighborhood</label>
            <input placeholder="Park Slope" value={form.neighborhood}
              onChange={e => update('neighborhood', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="label">Zip code</label>
            <input placeholder="11215" value={form.zip_code}
              onChange={e => update('zip_code', e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', margin: 0 }}>Unit details</h3>

        <div>
          <label className="label">Monthly rent ($) *</label>
          <input required type="number" min="1" placeholder="3500" value={form.price}
            onChange={e => update('price', e.target.value)} style={inputStyle} />
        </div>

        <div style={rowStyle}>
          <div>
            <label className="label">Bedrooms *</label>
            <input required type="number" min="0" placeholder="2" value={form.bedrooms}
              onChange={e => update('bedrooms', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="label">Bathrooms *</label>
            <input required type="number" min="0.5" step="0.5" placeholder="1" value={form.bathrooms}
              onChange={e => update('bathrooms', e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={rowStyle}>
          <div>
            <label className="label">Square footage</label>
            <input type="number" placeholder="850" value={form.sqft}
              onChange={e => update('sqft', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="label">Available date</label>
            <input type="date" value={form.available_date}
              onChange={e => update('available_date', e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea rows={4} placeholder="Describe the apartment — light, layout, vibe…"
            value={form.description}
            onChange={e => update('description', e.target.value)}
            style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
      </div>
    </div>,

    // ── TAB 1: COSTS & FEES ──
    <div key="fees" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{
        background: 'rgba(180,74,54,0.06)', border: '1px solid rgba(180,74,54,0.2)',
      }}>
        <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
          <strong>FARE Act compliance:</strong> NYC listings must disclose all fees a renter
          will pay. Since you're posting as the landlord's agent, no tenant-paid broker fee
          may be charged. Enter only fees the renter actually owes.
        </p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', margin: 0 }}>Standard fees</h3>

        <div style={rowStyle}>
          <div>
            <label className="label">Security deposit ($)</label>
            <input type="number" min="0" placeholder="0" value={form.security_deposit}
              onChange={e => update('security_deposit', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="label">Application fee ($)</label>
            <input type="number" min="0" placeholder="0" value={form.application_fee}
              onChange={e => update('application_fee', e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="label">Move-in fee ($)</label>
          <input type="number" min="0" placeholder="0" value={form.move_in_fee}
            onChange={e => update('move_in_fee', e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', margin: 0 }}>Other fees</h3>
          <button type="button" onClick={addOtherFee} className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '13px' }}>
            + Add fee
          </button>
        </div>

        {form.other_fees.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>
            No other fees added.
          </p>
        )}

        {form.other_fees.map((fee, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label className="label">Description</label>
              <input placeholder="e.g. Amenity fee" value={fee.description}
                onChange={e => updateOtherFee(i, 'description', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Amount ($)</label>
              <input type="number" min="0" placeholder="0" value={fee.amount}
                onChange={e => updateOtherFee(i, 'amount', e.target.value)} style={inputStyle} />
            </div>
            <button type="button" onClick={() => removeOtherFee(i)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)',
              padding: '12px 4px', display: 'flex',
            }}>
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: '15px' }}>Total due at signing</span>
        <span style={{ fontWeight: 700, fontSize: '20px', color: 'var(--terracotta)' }}>
          ${totalDueAtSigning().toLocaleString()}
        </span>
      </div>
    </div>,

    // ── TAB 2: AMENITIES ──
    <div key="amenities" className="card">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '6px' }}>Building & unit amenities</h3>
      <p style={{ fontSize: '13px', color: 'var(--warm-gray)', marginBottom: '20px' }}>Select everything that applies.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {amenityBtn('doorman', '🚪 Doorman')}
        {amenityBtn('elevator', '🛗 Elevator')}
        {amenityBtn('gym', '🏋️ Gym')}
        {amenityBtn('laundry', '🧺 Laundry in building')}
        {amenityBtn('dishwasher', '🍽️ Dishwasher')}
        {amenityBtn('hardwood', '🪵 Hardwood floors')}
        {amenityBtn('pets', '🐾 Pets allowed')}
        {amenityBtn('roof_deck', '🌇 Roof deck')}
        {amenityBtn('central_air', '❄️ Central air')}
        {amenityBtn('washer_dryer', '🫧 Washer/dryer in unit')}
        {amenityBtn('parking', '🚗 Parking')}
        {amenityBtn('storage', '📦 Storage')}
      </div>
    </div>,

    // ── TAB 2: PHOTOS ──
    <div key="photos" className="card">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '6px' }}>Photos</h3>
      <p style={{ fontSize: '13px', color: 'var(--warm-gray)', marginBottom: '20px' }}>
        Add up to 10 photos. The first photo is the cover. JPG, PNG, or HEIC.
      </p>

      {/* Drop zone */}
      {photos.length < 10 && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--terracotta)' : 'var(--sand-dark)'}`,
            borderRadius: '14px',
            padding: '40px 24px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '10px',
            cursor: 'pointer',
            background: dragging ? 'rgba(180,74,54,0.04)' : 'var(--sand)',
            transition: 'all 0.15s',
            marginBottom: photos.length ? '20px' : 0,
          }}
        >
          <Upload size={28} color={dragging ? 'var(--terracotta)' : 'var(--warm-gray)'} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>
              {photos.length === 0 ? 'Drag & drop photos here' : 'Add more photos'}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: '4px 0 0' }}>
              or click to browse — {10 - photos.length} remaining
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple
            onChange={e => { addFiles(e.target.files); e.target.value = '' }}
            style={{ display: 'none' }} />
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {photos.map((p, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '4/3' }}>
              <img src={p.preview} alt={`Photo ${i + 1}`} style={{
                width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px',
                border: i === 0 ? '2px solid var(--terracotta)' : '2px solid transparent',
              }} />
              {i === 0 && (
                <span style={{
                  position: 'absolute', bottom: '6px', left: '6px',
                  background: 'var(--terracotta)', color: '#fff',
                  fontSize: '10px', fontWeight: 700, padding: '2px 7px',
                  borderRadius: '4px', letterSpacing: '0.5px',
                }}>COVER</span>
              )}
              <button type="button" onClick={() => removePhoto(i)} style={{
                position: 'absolute', top: '6px', right: '6px',
                background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
                width: '26px', height: '26px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff',
              }}>
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>,

    // ── TAB 3: REVIEW ──
    <div key="review" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '16px' }}>Review your listing</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            ['Address', form.address + (form.neighborhood ? ` · ${form.neighborhood}` : '')],
            ['City / State', `${form.city}, ${form.state} ${form.zip_code}`],
            ['Rent', form.price ? `$${parseInt(form.price).toLocaleString()}/mo` : '—'],
            ['Bedrooms', form.bedrooms || '—'],
            ['Bathrooms', form.bathrooms || '—'],
            ['Sqft', form.sqft || '—'],
            ['Available', form.available_date || 'Immediately'],
            ['Photos', `${photos.length} photo${photos.length !== 1 ? 's' : ''}`],
            ['Amenities', Object.entries({
              doorman: 'Doorman', elevator: 'Elevator', gym: 'Gym',
              laundry: 'Laundry', dishwasher: 'Dishwasher', hardwood: 'Hardwood floors',
              pets: 'Pets allowed', roof_deck: 'Roof deck', central_air: 'Central air',
              washer_dryer: 'Washer/dryer', parking: 'Parking', storage: 'Storage',
            }).filter(([k]) => form[k]).map(([, v]) => v).join(', ') || 'None selected'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: '12px', fontSize: '14px' }}>
              <span style={{ color: 'var(--warm-gray)', minWidth: '90px', flexShrink: 0 }}>{label}</span>
              <span style={{ fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {form.description && (
        <div className="card">
          <p style={{ fontSize: '13px', color: 'var(--warm-gray)', marginBottom: '6px' }}>Description</p>
          <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{form.description}</p>
        </div>
      )}

      {photos.length > 0 && (
        <div className="card">
          <p style={{ fontSize: '13px', color: 'var(--warm-gray)', marginBottom: '12px' }}>Photos</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {photos.map((p, i) => (
              <img key={i} src={p.preview} alt="" style={{
                width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: '8px',
                border: i === 0 ? '2px solid var(--terracotta)' : 'none',
              }} />
            ))}
          </div>
        </div>
      )}
    </div>,
  ]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)',
        padding: '16px 24px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <button onClick={() => tab === 0 ? navigate('/dashboard') : setTab(t => t - 1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex' }}>
            <ChevronLeft size={24} />
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, flex: 1 }}>
            Post a listing
          </h1>
          <span style={{ fontSize: '13px', color: 'var(--warm-gray)' }}>
            {tab + 1} / {TABS.length}
          </span>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {TABS.map((name, i) => (
            <button key={name} onClick={() => setTab(i)}
              style={{
                flex: 1, padding: '8px 4px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: i === tab ? 700 : 400,
                color: i === tab ? 'var(--terracotta)' : 'var(--charcoal)',
                borderBottom: `2px solid ${i === tab ? 'var(--terracotta)' : 'transparent'}`,
                transition: 'all 0.15s',
              }}>
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
        {tabContent[tab]}
      </div>

      {/* Footer nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--white)', borderTop: '1px solid var(--sand-dark)',
        padding: '12px 24px',
bottom: '60px',
        display: 'flex', gap: '12px', zIndex: 99,
      }}>
        {tab > 0 && (
          <button onClick={() => setTab(t => t - 1)}
            style={{
              flex: 1, padding: '14px',
              background: 'var(--sand)', border: 'none', borderRadius: '12px',
              fontWeight: 600, fontSize: '15px', cursor: 'pointer', color: 'var(--charcoal)',
            }}>
            Back
          </button>
        )}

        {tab < TABS.length - 1 ? (
          <button
            onClick={() => setTab(t => t + 1)}
            style={{
              flex: 2, padding: '14px',
              background: canAdvance() ? 'var(--terracotta)' : 'var(--sand-dark)',
              border: 'none', borderRadius: '12px',
              fontWeight: 600, fontSize: '15px', cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'background 0.2s',
            }}>
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 2, padding: '14px',
              background: 'var(--terracotta)', border: 'none', borderRadius: '12px',
              fontWeight: 600, fontSize: '15px', cursor: 'pointer', color: '#fff',
              opacity: submitting ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
            {submitting
              ? <><Loader size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> {uploadProgress || 'Posting…'}</>
              : 'Post listing'}
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
