import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import RequestTour from '../components/RequestTour'
import toast from 'react-hot-toast'
import { X, Heart, MapPin, BedDouble, Bath, Maximize2, ChevronLeft, ChevronRight, Info } from 'lucide-react'

export default function SwipeDeck() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [filtersActive, setFiltersActive] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => { fetchListings() }, [])
  useEffect(() => { setPhotoIndex(0); setShowDetail(false) }, [currentIndex])

  async function fetchListings() {
    setLoading(true)

    const { data: swipedIds } = await supabase
      .from('swipes')
      .select('listing_id')
      .eq('renter_id', user.id)

    const excludeIds = swipedIds?.map(s => s.listing_id) || []

    const { data: prefs } = await supabase
      .from('renter_profiles')
      .select('budget_min, budget_max, bedrooms, sqft_min, neighborhoods')
      .eq('id', user.id)
      .maybeSingle()

    let query = supabase
      .from('listings')
      .select('*, profiles(name, email, phone)')
      .eq('status', 'active')

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`)
    }

    if (prefs?.budget_min > 0) query = query.gte('price', prefs.budget_min)
    if (prefs?.budget_max > 0) query = query.lte('price', prefs.budget_max)
    if (prefs?.bedrooms > 0) query = query.gte('bedrooms', prefs.bedrooms)

    const { data, error } = await query.limit(50)
    if (error) { toast.error('Could not load listings'); setLoading(false); return }

    let results = data || []

    if (prefs?.sqft_min > 0) {
      results = results.filter(l => !l.sqft || l.sqft >= prefs.sqft_min)
    }

    const hoods = (prefs?.neighborhoods || [])
      .map(n => n.trim().toLowerCase()).filter(Boolean)
    if (hoods.length > 0) {
      results = results.filter(l =>
        l.neighborhood && hoods.includes(l.neighborhood.trim().toLowerCase())
      )
    }

    setFiltersActive(
      prefs?.budget_min > 0 || prefs?.budget_max > 0 ||
      prefs?.bedrooms > 0 || prefs?.sqft_min > 0 || hoods.length > 0
    )

    setListings(results)
    setCurrentIndex(0)
    setLoading(false)
  }

  async function swipe(direction) {
    if (currentIndex >= listings.length) return
    const listing = listings[currentIndex]
    setSwiping(direction)

    setTimeout(async () => {
      const { error } = await supabase.from('swipes').insert({
        renter_id: user.id,
        listing_id: listing.id,
        direction,
      })

      if (!error && direction === 'right') {
        const { data: match } = await supabase
          .from('matches')
          .select('id')
          .eq('renter_id', user.id)
          .eq('listing_id', listing.id)
          .single()

        if (match) {
          toast.success("🎉 It's a match! Check your matches tab.", { duration: 4000 })
        }
      }

      setCurrentIndex(i => i + 1)
      setSwiping(null)
    }, 300)
  }

  const listing = listings[currentIndex]
  const photos = listing?.photos?.length > 0
    ? listing.photos
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80']

  function totalDueAtSigning(l) {
    if (!l) return 0
    const rent = l.price || 0
    const deposit = l.security_deposit || 0
    const appFee = l.application_fee || 0
    const moveIn = l.move_in_fee || 0
    const other = (l.other_fees || []).reduce((sum, f) => sum + (parseInt(f.amount) || 0), 0)
    return rent + deposit + appFee + moveIn + other
  }

  if (loading) return (
    <div className="center" style={{ height: '100dvh' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--sand)',
      display: 'flex', flexDirection: 'column',
      paddingBottom: '80px',
    }}>
      <div style={{
        padding: '20px 24px 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 600, color: 'var(--terracotta)' }}>
          cuna
        </div>
        <div style={{ fontSize: '13px', color: 'var(--warm-gray)' }}>
          {listings.length - currentIndex} left
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 24px' }}>
        {currentIndex >= listings.length ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '12px' }}>
              {filtersActive ? 'No listings match your filters' : "You've seen everything"}
            </h2>
            <p style={{ color: 'var(--warm-gray)', marginBottom: '24px' }}>
              {filtersActive
                ? 'Try widening your search preferences in Profile'
                : 'Check back soon for new listings'}
            </p>
            <button className="btn-primary" onClick={fetchListings}>Refresh</button>
          </div>
        ) : (
          <div
            ref={cardRef}
            style={{
              width: '100%', maxWidth: '400px',
              background: 'var(--white)',
              borderRadius: '24px',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              transform: swiping === 'left'
                ? 'translateX(-120%) rotate(-15deg)'
                : swiping === 'right'
                ? 'translateX(120%) rotate(15deg)'
                : 'none',
              transition: swiping ? 'transform 0.3s ease' : 'none',
              position: 'relative',
            }}
          >
            {swiping && (
              <div style={{
                position: 'absolute', top: '24px',
                left: swiping === 'right' ? '24px' : undefined,
                right: swiping === 'left' ? '24px' : undefined,
                zIndex: 10,
                padding: '8px 20px',
                border: `3px solid ${swiping === 'right' ? 'var(--like-green)' : 'var(--pass-red)'}`,
                borderRadius: '8px',
                color: swiping === 'right' ? 'var(--like-green)' : 'var(--pass-red)',
                fontWeight: 700, fontSize: '24px', letterSpacing: '2px',
                transform: 'rotate(-12deg)',
                background: 'rgba(255,255,255,0.9)',
              }}>
                {swiping === 'right' ? 'LIKE' : 'PASS'}
              </div>
            )}

            <div style={{ position: 'relative', height: '280px', overflow: 'hidden', background: 'var(--sand-dark)' }}>
              <img
                src={photos[photoIndex]}
                alt="Listing"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80' }}
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIndex(i => Math.max(0, i - 1))}
                    style={{
                      position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                      width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', opacity: photoIndex === 0 ? 0.3 : 1,
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setPhotoIndex(i => Math.min(photos.length - 1, i + 1))}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                      width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', opacity: photoIndex === photos.length - 1 ? 0.3 : 1,
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
                    {photos.map((_, i) => (
                      <div key={i} style={{
                        width: i === photoIndex ? '20px' : '6px', height: '6px',
                        borderRadius: '3px', background: 'white',
                        opacity: i === photoIndex ? 1 : 0.5,
                        transition: 'all 0.2s',
                      }} />
                    ))}
                  </div>
                </>
              )}
              <div style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'var(--terracotta)', color: 'white',
                padding: '6px 14px', borderRadius: '20px',
                fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600,
              }}>
                ${listing.price?.toLocaleString()}/mo
              </div>
              <button
                onClick={() => setShowDetail(true)}
                style={{
                  position: 'absolute', top: '16px', left: '16px',
                  background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%',
                  width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--charcoal)',
                }}
              >
                <Info size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, lineHeight: 1.2 }}>
                    {listing.address}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: 'var(--warm-gray)' }}>
                    <MapPin size={13} />
                    <span style={{ fontSize: '13px' }}>{listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}, {listing.state}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', margin: '16px 0', padding: '12px 0', borderTop: '1px solid var(--sand-dark)', borderBottom: '1px solid var(--sand-dark)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--charcoal-soft)' }}>
                  <BedDouble size={16} />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{listing.bedrooms} bed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--charcoal-soft)' }}>
                  <Bath size={16} />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{listing.bathrooms} bath</span>
                </div>
                {listing.sqft && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--charcoal-soft)' }}>
                    <Maximize2 size={16} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{listing.sqft?.toLocaleString()} sqft</span>
                  </div>
                )}
              </div>

              {listing.description && (
                <p style={{ fontSize: '14px', color: 'var(--warm-gray)', lineHeight: 1.5, marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {listing.description}
                </p>
              )}

              {listing.amenities?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {listing.amenities.slice(0, 4).map(a => (
                    <span key={a} className="tag">{a}</span>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowDetail(true)}
                style={{
                  marginTop: '16px', width: '100%',
                  background: 'none', border: '1px solid var(--sand-dark)', borderRadius: '10px',
                  padding: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--terracotta)',
                  cursor: 'pointer',
                }}
              >
                See full details & fees
              </button>
            </div>
          </div>
        )}
      </div>

      {showDetail && listing && (
        <div
          onClick={() => setShowDetail(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: '24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--white)', borderRadius: '24px',
              width: '100%', maxWidth: '480px', maxHeight: '85dvh', overflowY: 'auto',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, margin: 0 }}>
                  {listing.address}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: 'var(--warm-gray)' }}>
                  <MapPin size={13} />
                  <span style={{ fontSize: '13px' }}>{listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}, {listing.state}</span>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)} style={{
                background: 'var(--sand)', border: 'none', borderRadius: '50%',
                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', margin: '16px 0', padding: '12px 0', borderTop: '1px solid var(--sand-dark)', borderBottom: '1px solid var(--sand-dark)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--charcoal-soft)' }}>
                <BedDouble size={16} />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{listing.bedrooms} bed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--charcoal-soft)' }}>
                <Bath size={16} />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{listing.bathrooms} bath</span>
              </div>
              {listing.sqft && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--charcoal-soft)' }}>
                  <Maximize2 size={16} />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{listing.sqft?.toLocaleString()} sqft</span>
                </div>
              )}
            </div>

            {listing.description && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', color: 'var(--warm-gray)', lineHeight: 1.6, margin: 0 }}>
                  {listing.description}
                </p>
              </div>
            )}

            {listing.amenities?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Amenities</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {listing.amenities.map(a => (
                    <span key={a} className="tag">{a}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{
              background: 'rgba(180,74,54,0.06)', border: '1px solid rgba(180,74,54,0.2)',
              borderRadius: '10px', padding: '12px 14px', marginBottom: '16px',
            }}>
              <p style={{ fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
                Under the FARE Act, you can't be charged a broker fee unless you hired the broker yourself.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Costs & fees</p>

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
                paddingTop: '10px', marginTop: '4px', borderTop: '1px solid var(--sand-dark)',
                fontWeight: 700,
              }}>
                <span>Total due at signing</span>
                <span style={{ color: 'var(--terracotta)' }}>${totalDueAtSigning(listing).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentIndex < listings.length && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '32px',
          padding: '0 24px 16px',
        }}>
          <button
            onClick={() => swipe('left')}
            style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--white)', border: '2px solid var(--pass-red)',
              color: 'var(--pass-red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-md)', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--pass-red)'; e.currentTarget.style.color = 'white' }}
            onMouseOut={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.color = 'var(--pass-red)' }}
          >
            <X size={28} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => swipe('right')}
            style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--white)', border: '2px solid var(--like-green)',
              color: 'var(--like-green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-md)', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--like-green)'; e.currentTarget.style.color = 'white' }}
            onMouseOut={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.color = 'var(--like-green)' }}
          >
            <Heart size={28} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
