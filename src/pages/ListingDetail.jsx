import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import RequestTour from '../components/RequestTour'
import FairHousingNotice from '../components/FairHousingNotice'
import toast from 'react-hot-toast'
import { MapPin, BedDouble, Bath, Maximize2, ChevronLeft, ChevronRight, Heart } from 'lucide-react'

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [showTour, setShowTour] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchListing() }, [id, user])

  async function fetchListing() {
    setLoading(true)
    const { data, error } = await supabase
      .from('listings')
      .select('*, profiles(name, email, phone)')
      .eq('id', id)
      .maybeSingle()
    if (error || !data) {
      setListing(null)
      setLoading(false)
      return
    }
    setListing(data)
    setLoading(false)

    supabase.rpc('increment_listing_views', { listing_uuid: id }).then(() => {})

    if (user) {
      const { data: swipe } = await supabase
        .from('swipes')
        .select('id, direction')
        .eq('renter_id', user.id)
        .eq('listing_id', id)
        .maybeSingle()
      setSaved(swipe?.direction === 'right')
    }
  }

  function requireLogin() {
    navigate('/login?next=' + encodeURIComponent('/listing/' + id))
  }

  async function handleSave() {
    if (!user) { requireLogin(); return }
    if (profile?.role !== 'renter') { toast.error('Only renter accounts can save listings'); return }
    setSaving(true)
    try {
      const { data: existing } = await supabase
        .from('swipes')
        .select('id')
        .eq('renter_id', user.id)
        .eq('listing_id', id)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('swipes').update({ direction: 'right' }).eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('swipes').insert({
          renter_id: user.id, listing_id: id, direction: 'right',
        })
        if (error) throw error
      }
      setSaved(true)
      toast.success('Saved to your liked listings')
    } catch (err) {
      console.error('Save failed:', err)
      toast.error(err.message || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  function handleRequestTour() {
    if (!user) { requireLogin(); return }
    if (profile?.role !== 'renter') { toast.error('Only renter accounts can request tours'); return }
    setShowTour(true)
  }

  function totalDueAtSigning(l) {
    if (!l) return 0
    const other = (l.other_fees || []).reduce((sum, f) => sum + (parseInt(f.amount) || 0), 0)
    return (l.price || 0) + (l.security_deposit || 0) + (l.application_fee || 0) + (l.move_in_fee || 0) + other
  }

  if (loading) return <div className="center" style={{ height: '100dvh' }}><div className="spinner" /></div>

  if (!listing) return (
    <div className="center" style={{ height: '100dvh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '40px' }}>🏠</div>
      <p style={{ color: 'var(--warm-gray)' }}>This listing is no longer available.</p>
      <button className="btn-primary" onClick={() => navigate('/')}>Go to Cuna</button>
    </div>
  )

  const photos = listing.photos?.length > 0
    ? listing.photos
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80']

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '120px' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)',
        padding: '14px 24px', position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex',
        }}>
          <ChevronLeft size={22} />
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, color: 'var(--terracotta)' }}>
          cuna
        </span>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ position: 'relative', height: '320px', background: 'var(--sand-dark)' }}>
            <img
              src={photos[photoIndex]}
              alt="Listing"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80' }}
            />
            {photos.length > 1 && (
              <>
                <button onClick={() => setPhotoIndex(i => Math.max(0, i - 1))} style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                  width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', opacity: photoIndex === 0 ? 0.3 : 1,
                }}>
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setPhotoIndex(i => Math.min(photos.length - 1, i + 1))} style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                  width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', opacity: photoIndex === photos.length - 1 ? 0.3 : 1,
                }}>
                  <ChevronRight size={18} />
                </button>
                <div style={{
                  position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '12px',
                  padding: '3px 10px', borderRadius: '12px',
                }}>
                  {photoIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 600, color: 'var(--terracotta)',
            }}>
              ${listing.price?.toLocaleString()}<span style={{ fontSize: '16px', color: 'var(--warm-gray)' }}>/mo</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600, margin: '6px 0 4px' }}>
              {listing.address}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warm-gray)' }}>
              <MapPin size={14} />
              <span style={{ fontSize: '14px' }}>
                {listing.neighborhood ? listing.neighborhood + ', ' : ''}{listing.city}, {listing.state}
              </span>
            </div>

            <div style={{
              display: 'flex', gap: '18px', margin: '18px 0', padding: '14px 0',
              borderTop: '1px solid var(--sand-dark)', borderBottom: '1px solid var(--sand-dark)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--charcoal-soft)' }}>
                <BedDouble size={17} />
                <span style={{ fontSize: '15px', fontWeight: 500 }}>{listing.bedrooms} bed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--charcoal-soft)' }}>
                <Bath size={17} />
                <span style={{ fontSize: '15px', fontWeight: 500 }}>{listing.bathrooms} bath</span>
              </div>
              {listing.sqft && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--charcoal-soft)' }}>
                  <Maximize2 size={17} />
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>{listing.sqft?.toLocaleString()} sqft</span>
                </div>
              )}
            </div>

            {listing.description && (
              <p style={{ fontSize: '15px', color: 'var(--charcoal-soft)', lineHeight: 1.7, marginBottom: '20px' }}>
                {listing.description}
              </p>
            )}

            {listing.amenities?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Amenities</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {listing.amenities.map(a => <span key={a} className="tag">{a}</span>)}
                </div>
              </div>
            )}

            <div style={{
              background: 'rgba(180,74,54,0.06)', border: '1px solid rgba(180,74,54,0.2)',
              borderRadius: '10px', padding: '12px 14px', marginBottom: '18px',
            }}>
              <p style={{ fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
                Under the FARE Act, you can't be charged a broker fee unless you hired the broker yourself.
              </p>
            </div>

            <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>Costs & fees</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--warm-gray)' }}>Monthly rent</span>
                <span style={{ fontWeight: 500 }}>${listing.price?.toLocaleString()}</span>
              </div>
              {listing.security_deposit > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--warm-gray)' }}>Security deposit</span>
                  <span style={{ fontWeight: 500 }}>${listing.security_deposit.toLocaleString()}</span>
                </div>
              )}
              {listing.application_fee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--warm-gray)' }}>Application fee</span>
                  <span style={{ fontWeight: 500 }}>${listing.application_fee.toLocaleString()}</span>
                </div>
              )}
              {listing.move_in_fee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--warm-gray)' }}>Move-in fee</span>
                  <span style={{ fontWeight: 500 }}>${listing.move_in_fee.toLocaleString()}</span>
                </div>
              )}
              {(listing.other_fees || []).map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--warm-gray)' }}>{f.description}</span>
                  <span style={{ fontWeight: 500 }}>${parseInt(f.amount || 0).toLocaleString()}</span>
                </div>
              ))}
              <div style={{
                display: 'flex', justifyContent: 'space-between', fontSize: '15px',
                paddingTop: '10px', borderTop: '1px solid var(--sand-dark)', fontWeight: 700,
              }}>
                <span>Total due at signing</span>
                <span style={{ color: 'var(--terracotta)' }}>${totalDueAtSigning(listing).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <FairHousingNotice />
        </div>
      </div>

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--white)', borderTop: '1px solid var(--sand-dark)',
        padding: '12px 24px', display: 'flex', gap: '12px', zIndex: 99,
      }}>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          style={{
            flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 600, fontSize: '15px',
            cursor: saved ? 'default' : 'pointer',
            background: saved ? 'rgba(76,175,125,0.12)' : 'var(--sand)',
            border: 'none',
            color: saved ? 'var(--like-green)' : 'var(--charcoal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            opacity: saving ? 0.7 : 1,
          }}
        >
          <Heart size={16} />
          {saved ? 'Saved' : saving ? 'Saving…' : 'Save'}
        </button>
        <button
          className="btn-primary"
          onClick={handleRequestTour}
          style={{ flex: 2, padding: '14px', fontSize: '15px' }}
        >
          Request a tour
        </button>
      </div>

      {showTour && (
        <RequestTour listing={listing} onClose={() => setShowTour(false)} />
      )}
    </div>
  )
}
