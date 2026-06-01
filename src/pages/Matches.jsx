import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { MessageCircle, MapPin, BedDouble } from 'lucide-react'

export default function Matches() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchMatches() }, [])

  async function fetchMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        listings(address, city, state, neighborhood, price, bedrooms, bathrooms, photos),
        profiles!matches_poster_id_fkey(name, email)
      `)
      .eq('renter_id', user.id)
      .order('matched_at', { ascending: false })

    if (!error) setMatches(data || [])
    setLoading(false)
  }

  if (loading) return (
    <div className="center" style={{ height: '100dvh' }}><div className="spinner" /></div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '80px' }}>
      <div style={{ padding: '24px 24px 0' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500 }}>Your matches</h1>
        <p style={{ color: 'var(--warm-gray)', fontSize: '14px', marginTop: '4px' }}>
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </p>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💛</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '8px' }}>No matches yet</h2>
            <p style={{ color: 'var(--warm-gray)', fontSize: '14px' }}>Keep swiping — your match is out there</p>
          </div>
        ) : matches.map(match => {
          const listing = match.listings
          const poster = match.profiles
          const photo = listing?.photos?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80'

          return (
            <div
              key={match.id}
              className="card"
              style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onClick={() => navigate(`/messages/${match.id}`)}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
            >
              <div style={{ display: 'flex' }}>
                <img src={photo} alt="" style={{ width: '100px', height: '100px', objectFit: 'cover', flexShrink: 0 }}
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80' }} />
                <div style={{ padding: '16px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '2px' }}>{listing?.address}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warm-gray)', fontSize: '12px' }}>
                        <MapPin size={11} />
                        {listing?.neighborhood ? `${listing.neighborhood}, ` : ''}{listing?.city}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--terracotta)', fontWeight: 600 }}>
                      ${listing?.price?.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--charcoal-soft)' }}>
                      <BedDouble size={13} /> {listing?.bedrooms} bed
                    </div>
                    <div style={{ flex: 1 }} />
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'var(--terracotta)', color: 'white',
                      padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                    }}>
                      <MessageCircle size={13} />
                      Message
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--warm-gray)', marginTop: '6px' }}>
                    Listed by {poster?.name}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <BottomNav />
    </div>
  )
}