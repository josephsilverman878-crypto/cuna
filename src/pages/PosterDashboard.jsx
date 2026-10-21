import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { getSaveCounts } from '../lib/swipes'
import toast from 'react-hot-toast'
import { Plus, Users, Eye, BedDouble, Bath, Pencil, ShieldCheck, CalendarCheck, Mail, Phone } from 'lucide-react'
import { LISTING_STATUSES, statusLabel, isPublicStatus } from '../lib/listingStatus'

export default function PosterDashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [saves, setSaves] = useState({})
  const [inquiries, setInquiries] = useState([])
  const [inquiriesError, setInquiriesError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('listings')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: listingData } = await supabase
      .from('listings')
      .select('*')
      .eq('poster_id', user.id)
      .order('created_at', { ascending: false })

    setListings(listingData || [])

    if (listingData?.length > 0) {
      const ids = listingData.map(l => l.id)

      // Saves are deliberately aggregate-only: posters see interest counts, never
      // who saved. Renter identity is shared only when the renter sends a tour
      // request. Do not re-add profile lookups here.
      const { data: swipeData, error: swipeError } = await getSaveCounts(ids)

      if (swipeError) console.error('Saves fetch error:', swipeError)

      const counts = {}
      ;(swipeData || []).forEach(s => {
        counts[s.listing_id] = (counts[s.listing_id] || 0) + 1
      })
      setSaves(counts)
    }

    // One call replaces the inquiries select plus the profiles lookup. The
    // function is SECURITY DEFINER and pinned to auth.uid(), so it returns only
    // inquiries on this poster's own listings. Renter name and email come from
    // profiles inside the function; every other renter field is the inquiry's
    // own shared_* snapshot, never a live read of renter_profiles.
    const { data: inquiryData, error: inqError } =
      await supabase.rpc('poster_inquiry_contacts')

    // An RPC failure used to fall through to the "No tour requests yet" empty
    // state, which tells a poster they have no interest when in fact the request
    // failed. Track it so the tab can say so and offer a retry.
    setInquiriesError(Boolean(inqError))
    if (inqError) console.error('Inquiries fetch error:', inqError)

    let enrichedInquiries = []
    if (inquiryData?.length > 0) {
      const listingIds = [...new Set(inquiryData.map(i => i.listing_id))]

      const { data: inqListings } = await supabase
        .from('listings')
        .select('id, address')
        .in('id', listingIds)

      enrichedInquiries = inquiryData.map(i => ({
        ...i,
        // The function returns inquiry_id; the rest of this page expects `id`.
        id: i.inquiry_id,
        renter: { name: i.renter_name, email: i.renter_email },
        listing: inqListings?.find(l => l.id === i.listing_id) || null,
      }))
    }
    setInquiries(enrichedInquiries)

    setLoading(false)
  }

  // Posters move a listing between the five statuses here, including back to
  // active. There is no delete: a listing is a record, and "De-listed" is the
  // end of the road. Every failure is shown -- the old handlers swallowed
  // errors and left the poster looking at a status that had not changed.
  async function setStatus(listing, newStatus) {
    if (!newStatus || newStatus === listing.status) return
    const { data, error } = await supabase
      .from('listings')
      .update({ status: newStatus })
      .eq('id', listing.id)
      .select('id, status, status_changed_at, listed_at')
      .maybeSingle()
    if (error) {
      toast.error(`Could not change status: ${error.message}`)
      return
    }
    if (!data) {
      toast.error('Could not change status: the listing was not updated')
      return
    }
    setListings(prev => prev.map(l => l.id === listing.id ? { ...l, ...data } : l))
    toast.success(`Marked ${statusLabel(newStatus).toLowerCase()}`)
  }

  if (loading) return <div className="center" style={{ height: '100dvh' }}><div className="spinner" /></div>

  const totalSaves = Object.values(saves).reduce((sum, n) => sum + n, 0)
  const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0)

  function inquiryCountFor(listingId) {
    return inquiries.filter(i => i.listing_id === listingId).length
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '80px' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)',
        padding: '20px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 600, color: 'var(--terracotta)' }}>cuna</div>
          <div style={{ fontSize: '13px', color: 'var(--warm-gray)', marginTop: '2px' }}>Welcome, {profile?.name?.split(' ')[0]}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {profile?.is_admin && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: '10px 16px', fontSize: '14px', borderRadius: '20px',
                background: 'var(--white)', border: '1.5px solid var(--terracotta)',
                color: 'var(--terracotta)', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <ShieldCheck size={16} /> Admin
            </button>
          )}
          <button
            className="btn-primary"
            style={{ padding: '10px 18px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => navigate('/post-listing')}
          >
            <Plus size={16} /> New listing
          </button>
        </div>
      </div>

      {profile && !profile.verified && (
        <div style={{ padding: '20px 24px 0' }}>
          <div className="card" style={{
            background: 'rgba(196,113,74,0.06)', border: '1px solid rgba(196,113,74,0.25)',
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <div style={{ fontSize: '24px', flexShrink: 0 }}>🕐</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
                Verification in progress
              </div>
              <div style={{ fontSize: '13px', color: 'var(--warm-gray)', lineHeight: 1.5 }}>
                Your license details are under review. You'll be able to publish listings once verified.
              </div>
            </div>
            <button
              onClick={() => navigate('/profile')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--terracotta)', fontSize: '13px', fontWeight: 600, flexShrink: 0,
              }}
            >
              View status
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '20px 24px 0' }}>
        {[
          { label: 'Active listings', value: listings.filter(l => l.status === 'active').length },
          { label: 'Views', value: totalViews },
          { label: 'Saves', value: totalSaves },
          { label: 'Tour requests', value: inquiries.length },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600, color: 'var(--terracotta)' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--warm-gray)', marginTop: '4px', lineHeight: 1.3 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', padding: '20px 24px 0', gap: '8px' }}>
        {[
          { id: 'listings', label: 'My listings' },
          { id: 'saves', label: `Saves (${totalSaves})` },
          { id: 'inquiries', label: `Requests (${inquiries.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
              background: activeTab === tab.id ? 'var(--terracotta)' : 'var(--white)',
              color: activeTab === tab.id ? 'white' : 'var(--warm-gray)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {activeTab === 'listings' && (
          listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '8px' }}>No listings yet</h2>
              <p style={{ color: 'var(--warm-gray)', marginBottom: '24px', fontSize: '14px' }}>Post your first listing to start receiving interest</p>
              <button className="btn-primary" onClick={() => navigate('/post-listing')}>Post a listing</button>
            </div>
          ) : listings.map(listing => (
            <div key={listing.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div
                  style={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => navigate('/listing/' + listing.id)}
                >
                  <div style={{ fontWeight: 600, fontSize: '16px' }}>{listing.address}</div>
                  <div style={{ fontSize: '13px', color: 'var(--warm-gray)', marginTop: '2px' }}>
                    {listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}, {listing.state}
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                  background: listing.status === 'active' ? 'rgba(76,175,125,0.15)'
                    : isPublicStatus(listing.status) ? 'rgba(180,74,54,0.12)' : 'rgba(155,142,136,0.15)',
                  color: listing.status === 'active' ? 'var(--like-green)'
                    : isPublicStatus(listing.status) ? 'var(--terracotta)' : 'var(--warm-gray)',
                }}>
                  {statusLabel(listing.status)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--terracotta)', fontWeight: 600 }}>
                  ${listing.price?.toLocaleString()}/mo
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--charcoal-soft)' }}>
                  <BedDouble size={14} /> {listing.bedrooms} bed
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--charcoal-soft)' }}>
                  <Bath size={14} /> {listing.bathrooms} bath
                </div>
              </div>

              <div style={{
                display: 'flex', gap: '18px', padding: '10px 0', marginBottom: '10px',
                borderTop: '1px solid var(--sand-dark)', borderBottom: '1px solid var(--sand-dark)',
                fontSize: '13px', color: 'var(--warm-gray)',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Eye size={14} /> {listing.views || 0} views
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Users size={14} /> {saves[listing.id] || 0} saves
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CalendarCheck size={14} /> {inquiryCountFor(listing.id)} requests
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--charcoal-soft)' }}>
                  <span>Status</span>
                  <select
                    value={listing.status}
                    onChange={e => setStatus(listing, e.target.value)}
                    aria-label={`Status for ${listing.address}`}
                    style={{
                      padding: '8px 10px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                      border: '1px solid var(--sand-dark)', background: 'var(--white)', color: 'var(--charcoal)',
                      cursor: 'pointer',
                    }}
                  >
                    {LISTING_STATUSES.map(st => (
                      <option key={st.id} value={st.id}>{st.label}</option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={() => navigate(`/edit-listing/${listing.id}`)}
                  className="btn-ghost"
                  style={{ fontSize: '13px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Pencil size={14} /> Edit
                </button>
              </div>
            </div>
          ))
        )}

        {activeTab === 'saves' && (
          totalSaves === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--warm-gray)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💾</div>
              <p>No saves yet. Make sure your listings are active.</p>
            </div>
          ) : (
            <>
              <p style={{
                fontSize: '13px', color: 'var(--warm-gray)', lineHeight: 1.6, margin: 0,
              }}>
                Saves show interest in your listing. Renter details are shared when someone
                sends you a tour request.
              </p>

              {listings.map(listing => {
                const count = saves[listing.id] || 0
                if (count === 0) return null
                return (
                  <div key={listing.id} className="card" style={{
                    padding: '16px 18px', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center', gap: '14px',
                  }}>
                    <div
                      style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}
                      onClick={() => navigate('/listing/' + listing.id)}
                    >
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{listing.address}</div>
                      <div style={{ fontSize: '13px', color: 'var(--warm-gray)', marginTop: '2px' }}>
                        {listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}, {listing.state}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontSize: '26px',
                        fontWeight: 600, color: 'var(--terracotta)', lineHeight: 1,
                      }}>
                        {count}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--warm-gray)', marginTop: '4px' }}>
                        {count === 1 ? 'save' : 'saves'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )
        )}

        {activeTab === 'inquiries' && (
          inquiriesError ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--warm-gray)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <p style={{ fontWeight: 600, color: 'var(--charcoal)' }}>
                Could not load your tour requests and questions.
              </p>
              <p style={{ fontSize: '13px', marginTop: '6px' }}>
                This is a loading problem, not an empty inbox — you may have requests waiting.
              </p>
              <button
                className="btn-secondary"
                onClick={() => { setInquiriesError(false); fetchData() }}
                style={{ marginTop: '18px', padding: '10px 22px', fontSize: '14px' }}
              >
                Try again
              </button>
            </div>
          ) : inquiries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--warm-gray)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📩</div>
              <p>No tour requests or questions yet.</p>
            </div>
          ) : inquiries.map(inq => (
            <div key={inq.id} className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{inq.renter?.name}</div>
                  <div
                    style={{ fontSize: '13px', color: 'var(--warm-gray)', marginTop: '2px', cursor: 'pointer' }}
                    onClick={() => navigate('/listing/' + inq.listing_id)}
                  >
                    {inq.listing?.address}
                  </div>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px',
                  background: inq.kind === 'question' ? 'rgba(76,175,125,0.15)' : 'rgba(180,74,54,0.1)',
                  color: inq.kind === 'question' ? 'var(--like-green)' : 'var(--terracotta)', flexShrink: 0,
                }}>
                  {inq.kind === 'question' ? 'Question' : inq.tour_type === 'video' ? 'Video chat' : 'In person'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', marginBottom: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--terracotta)' }}>
                  <Mail size={13} /> {inq.renter?.email}
                </span>
                {/* Phone comes from the inquiry snapshot, not the live profile —
                    it appears only if the renter shared it when they sent this. */}
                {inq.shared_phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warm-gray)' }}>
                    <Phone size={13} /> {inq.shared_phone}
                  </span>
                )}
              </div>

              {(inq.shared_move_in_date || typeof inq.shared_has_pets === 'boolean' || inq.shared_credit_score_range) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  {inq.shared_move_in_date && (
                    <span className="tag">🗓 Move in {new Date(inq.shared_move_in_date).toLocaleDateString()}</span>
                  )}
                  {inq.shared_has_pets === true && (
                    <span className="tag">
                      🐾 Has pets{inq.shared_pet_details ? ` — ${inq.shared_pet_details}` : ''}
                    </span>
                  )}
                  {inq.shared_has_pets === false && <span className="tag">No pets</span>}
                  {inq.shared_credit_score_range && (
                    <span className="tag">📊 Credit: {inq.shared_credit_score_range.replace('_', '-')}</span>
                  )}
                </div>
              )}

              {(inq.preferred_times || []).length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--warm-gray)', marginBottom: '4px' }}>
                    Preferred times
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {inq.preferred_times.map((t, i) => <span key={i} className="tag">{t}</span>)}
                  </div>
                </div>
              )}

              {inq.message && (
                <p style={{
                  fontSize: '13px', color: 'var(--charcoal-soft)', lineHeight: 1.5,
                  background: 'var(--sand)', padding: '10px 12px', borderRadius: '8px', margin: '0 0 10px',
                }}>
                  {inq.message}
                </p>
              )}

              <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>
                Requested {new Date(inq.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}
