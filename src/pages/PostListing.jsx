import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import toast from 'react-hot-toast'
import { Link2, Loader, ChevronLeft } from 'lucide-react'

const EMPTY_FORM = {
  source_url: '', source_platform: 'manual',
  address: '', city: '', state: '', neighborhood: '', zip_code: '',
  price: '', bedrooms: '', bathrooms: '', sqft: '',
  description: '', amenities: '', available_date: '',
}

export default function PostListing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [scraping, setScraping] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function scrapeUrl() {
    if (!urlInput.trim()) return
    setScraping(true)
    try {
      const platform = urlInput.includes('streeteasy') ? 'streeteasy'
        : urlInput.includes('zillow') ? 'zillow' : 'manual'

      let pageContent = ''
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlInput)}`
        const res = await fetch(proxyUrl)
        const data = await res.json()
        pageContent = data.contents?.substring(0, 8000) || ''
      } catch {
        pageContent = `URL: ${urlInput}`
      }

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
          messages: [{
            role: 'user',
            content: `Extract rental listing details from this webpage content and return ONLY a JSON object with these exact fields (use null if not found):
{
  "address": "street address only",
  "city": "city name",
  "state": "2-letter state code",
  "neighborhood": "neighborhood name",
  "zip_code": "zip code",
  "price": number (monthly rent, no $ or commas),
  "bedrooms": number,
  "bathrooms": number (can be decimal like 1.5),
  "sqft": number or null,
  "description": "property description",
  "amenities": ["amenity1", "amenity2"],
  "available_date": "YYYY-MM-DD or null"
}

URL: ${urlInput}
Page content: ${pageContent}

Return ONLY the JSON, no other text.`,
          }],
        }),
      })

      const data = await response.json()
      const text = data.content?.[0]?.text || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)

      setForm(f => ({
        ...f,
        source_url: urlInput,
        source_platform: platform,
        address: parsed.address || '',
        city: parsed.city || '',
        state: parsed.state || '',
        neighborhood: parsed.neighborhood || '',
        zip_code: parsed.zip_code || '',
        price: parsed.price?.toString() || '',
        bedrooms: parsed.bedrooms?.toString() || '',
        bathrooms: parsed.bathrooms?.toString() || '',
        sqft: parsed.sqft?.toString() || '',
        description: parsed.description || '',
        amenities: Array.isArray(parsed.amenities) ? parsed.amenities.join(', ') : '',
        available_date: parsed.available_date || '',
      }))
      toast.success('Listing details extracted! Review and submit.')
    } catch (err) {
      console.error(err)
      toast.error('Could not extract details — fill in manually below')
    } finally {
      setScraping(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const amenitiesArray = form.amenities
        ? form.amenities.split(',').map(a => a.trim()).filter(Boolean)
        : []

      const { error } = await supabase.from('listings').insert({
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
        amenities: amenitiesArray,
        available_date: form.available_date || null,
        status: 'active',
      })

      if (error) throw error
      toast.success('Listing posted!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Failed to post listing')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = { marginTop: '6px' }
  const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '100px' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)',
        padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600 }}>Post a listing</h1>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Link2 size={18} color="var(--terracotta)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>Paste a listing URL</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--warm-gray)', marginBottom: '16px' }}>
            Paste a Zillow or StreetEasy URL and we'll fill in the details automatically.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="url"
              placeholder="https://streeteasy.com/... or zillow.com/..."
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              onClick={scrapeUrl}
              disabled={scraping || !urlInput.trim()}
              className="btn-primary"
              style={{ whiteSpace: 'nowrap', opacity: scraping ? 0.7 : 1, padding: '12px 20px' }}
            >
              {scraping ? <Loader size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Import'}
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '24px' }}>
            Listing details
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                <input required type="number" min="0.5" step="0.5" placeholder="1.5" value={form.bathrooms}
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
              <textarea
                rows={4} placeholder="Describe the apartment..."
                value={form.description}
                onChange={e => update('description', e.target.value)}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div>
              <label className="label">Amenities (comma-separated)</label>
              <input placeholder="Doorman, Gym, Laundry, Dishwasher, Roof deck"
                value={form.amenities}
                onChange={e => update('amenities', e.target.value)} style={inputStyle} />
            </div>

            <button
              type="submit" className="btn-primary w-full"
              style={{ opacity: submitting ? 0.7 : 1 }}
              disabled={submitting}
            >
              {submitting ? 'Posting...' : 'Post listing'}
            </button>
          </form>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}