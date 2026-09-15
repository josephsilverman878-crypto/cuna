import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import RequestTour from '../components/RequestTour'
import toast from 'react-hot-toast'
import { MapPin, BedDouble, Bath, RotateCcw, EyeOff, CalendarCheck } from 'lucide-react'

export default function SwipeHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('saved')
  const [swipes, setSwipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tourListing, setTourListing] = useState(null)

  useEffect(() => { fetchSwipes() }, [])

  async function fetchSwipes() {
    setLoading(true)
    const { data: swipeData, error } = await supabase
      .from('swipes')
      .select('*')
      .eq('renter_id', user.id)
      .order('swiped_at', { ascending: false })

    if (error) { toast.error('Could not load history'); setLoading(false); return }

    let enriched = []
    if (swipeData?.length > 0) {
      const listingIds = [...new Set(swipeData.map(s => s.listing_id))]
      const { data: listingData } = await supabase
        .from('listings')
        .select('*, profiles(name, email, phone)')
        .in('id', listingIds)

      enriched = swipeData
        .map(s => ({ ...s, listing: listingData?.find(l => l.id === s.listing_id) || null }))
        .filter(s => s.listing)
    }

    setSwipes(enriched)
    setLoading(false)
  }

  // Only ever touches `hidden`. liked and hidden are independent now — a renter
  // can save a listing and also keep it out of their feed, and hiding must not
  // quietly unsave it.
  async function setHidden(swipe, value) {
    const { error } = await supabase
      .from('swipes')
      .update({ hidden: value })
      .eq('id', swipe.id)
    if (!error) {
      setSwipes(prev => prev.map(s => s.id === swipe.id ? { ...s, hidden: value } : s))
      toast.success(value ? 'Hidden from your feed' : 'Unhidden')
    } else {
      toast.error(value ? 'Could not hide listing' : 'Could not unhide listing')
    }
  }

  async function removeSwipe(swipe) {
    const { error } = await supabase
      .from('swipes')
      .delete()
      .eq('id', swipe.id)
    if (!error) {
      setSwipes(prev => prev.filter(s => s.id !== swipe.id))
      toast.success('Removed — it will show up in Discover again')
    } else {
      toast.error('Could not remove')
    }
  }

  const filtered = swipes.filter(s => tab === 'saved' ? s.liked : s.hidden)
  const likedCount = swipes.filter(s => s.liked).length
  const passedCount = swipes.filter(s => s.hidden).length

  if (loading) return <div className="center" style={{ height: '100dvh' }}><div className="spinner" /></div>

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '80px' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)',
        padding: '20px 24px',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 600, color: 'var(--terracotta)' }}>
          Saved
        </div>
        <div style={{ fontSize: '13px', color: 'var(--warm-gray)', marginTop: '2px' }}>
          Listings you've saved or passed on
        </div>
      </div>

      <div style={{ display: 'flex', padding: '20px 24px 0', gap: '8px' }}>
        {[
          { id: 'saved', label: `❤️ Saved (${likedCount})` },
          { id: 'passed', label: `🚫 Hidden (${passedCount})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
              background: tab === t.id ? 'var(--terracotta)' : 'var(--white)',
              color: tab === t.id ? 'white' : 'var(--warm-gray)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--warm-gray)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {tab === 'saved' ? '❤️' : '🚫'}
            </div>
            <p>{tab === 'saved' ? 'No saved listings yet.' : 'No hidden listings yet.'}</p>
          </div>
        ) : filtered.map(swipe => {
          const listing = swipe.listing
          const cover = listing.photos?.length > 0
            ? listing.photos[0]
            : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80'
          return (
            <div key={swipe.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{ display: 'flex', cursor: 'pointer' }}
                onClick={() => navigate('/listing/' + listing.id)}
              >
                <img src={cover} alt="" style={{ width: '110px', height: '110px', objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ padding: '12px 16px', flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {listing.address}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: 'var(--warm-gray)', fontSize: '12px' }}>
                    <MapPin size={11} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--terracotta)', fontWeight: 600, marginTop: '4px' }}>
                    ${listing.price?.toLocaleString()}/mo
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '12px', color: 'var(--charcoal-soft)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><BedDouble size={12} /> {listing.bedrooms}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Bath size={12} /> {listing.bathrooms}</span>
                  </div>
                </div>
              </div>
              {tab === 'saved' && (
                <button
                  onClick={() => setTourListing(listing)}
                  style={{
                    width: '100%', padding: '11px', border: 'none', cursor: 'pointer',
                    borderTop: '1px solid var(--sand-dark)',
                    background: 'rgba(180,74,54,0.06)',
                    fontSize: '13px', fontWeight: 600, color: 'var(--terracotta)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}
                >
                  <CalendarCheck size={14} />
                  Request a tour
                </button>
              )}
              <div style={{ display: 'flex', borderTop: '1px solid var(--sand-dark)' }}>
                <button
                  onClick={() => setHidden(swipe, tab === 'saved')}
                  style={{
                    flex: 1, padding: '10px', background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 600, color: 'var(--warm-gray)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}
                >
                  <EyeOff size={13} />
                  {tab === 'saved' ? 'Hide from feed' : 'Unhide'}
                </button>
                <div style={{ width: '1px', background: 'var(--sand-dark)' }} />
                <button
                  onClick={() => removeSwipe(swipe)}
                  style={{
                    flex: 1, padding: '10px', background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 600, color: 'var(--terracotta)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}
                >
                  <RotateCcw size={13} />
                  Remove & re-discover
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {tourListing && (
        <RequestTour listing={tourListing} onClose={() => setTourListing(null)} />
      )}

      <BottomNav />
    </div>
  )
}
