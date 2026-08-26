import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import RequestTour from '../components/RequestTour'
import FairHousingNotice from '../components/FairHousingNotice'
import { petsPolicyLabel } from '../lib/petsPolicy'
import toast from 'react-hot-toast'
import { MapPin, BedDouble, Bath, Maximize2, ChevronLeft, ChevronRight, Heart, MoreVertical, EyeOff, Filter } from 'lucide-react'

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80'

// Module scope on purpose — same reason as Profile.jsx's Toggle. Declared inside
// Feed() this would be a new component type on every parent render, so every card
// would unmount and remount whenever the feed list changed, resetting each card's
// photoIndex and closing any open menu.
function FeedCard({ listing, liked, onToggleLike, onHide, onRequestTour, onOpen }) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const photos = listing.photos?.length > 0 ? listing.photos : [FALLBACK_PHOTO]

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ position: 'relative', height: '280px', overflow: 'hidden', background: 'var(--sand-dark)' }}>
        <img
          src={photos[photoIndex]}
          alt="Listing"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.src = FALLBACK_PHOTO }}
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
            <div style={{
              position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: '6px',
            }}>
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
          onClick={() => setMenuOpen(o => !o)}
          aria-label="More options"
          style={{
            position: 'absolute', top: '16px', left: '16px',
            background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%',
            width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--charcoal)',
          }}
        >
          <MoreVertical size={18} />
        </button>

        {menuOpen && (
          <>
            {/* Click-away layer, same pattern as the RequestTour backdrop. */}
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 90 }}
            />
            <div style={{
              position: 'absolute', top: '56px', left: '16px', zIndex: 91,
              background: 'var(--white)', borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-md)', overflow: 'hidden', minWidth: '170px',
            }}>
              <button
                onClick={() => { setMenuOpen(false); onHide(listing) }}
                style={{
                  width: '100%', padding: '12px 14px', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: '14px', color: 'var(--charcoal)',
                  display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left',
                }}
              >
                <EyeOff size={15} />
                Hide from feed
              </button>
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '20px' }}>
        <div
          onClick={() => onOpen(listing)}
          style={{ cursor: 'pointer' }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, lineHeight: 1.2 }}>
            {listing.address}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: 'var(--warm-gray)' }}>
            <MapPin size={13} />
            <span style={{ fontSize: '13px' }}>
              {listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}, {listing.state}
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex', gap: '16px', margin: '16px 0', padding: '12px 0',
          borderTop: '1px solid var(--sand-dark)', borderBottom: '1px solid var(--sand-dark)',
        }}>
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
          <p style={{
            fontSize: '14px', color: 'var(--warm-gray)', lineHeight: 1.5, marginBottom: '16px',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {listing.description}
          </p>
        )}

        {(petsPolicyLabel(listing.pets_policy) || listing.amenities?.length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {petsPolicyLabel(listing.pets_policy) && (
              <span className="tag">🐾 {petsPolicyLabel(listing.pets_policy)}</span>
            )}
            {(listing.amenities || []).slice(0, 4).map(a => (
              <span key={a} className="tag">{a}</span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', alignItems: 'stretch' }}>
          <button
            onClick={() => onToggleLike(listing)}
            aria-label={liked ? 'Unlike' : 'Like'}
            style={{
              width: '44px', flexShrink: 0,
              background: liked ? 'rgba(76,175,125,0.12)' : 'var(--white)',
              border: `1px solid ${liked ? 'var(--like-green)' : 'var(--sand-dark)'}`,
              borderRadius: '10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <Heart
              size={18}
              fill={liked ? 'var(--like-green)' : 'none'}
              color={liked ? 'var(--like-green)' : 'var(--warm-gray)'}
            />
          </button>
          <button
            onClick={() => onOpen(listing)}
            style={{
              flex: 1,
              background: 'none', border: '1px solid var(--sand-dark)', borderRadius: '10px',
              padding: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--terracotta)',
              cursor: 'pointer',
            }}
          >
            Details & fees
          </button>
          <button
            onClick={() => onRequestTour(listing)}
            className="btn-primary"
            style={{ flex: 1, padding: '10px', fontSize: '13px' }}
          >
            Request a tour
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Feed() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filtersOn, setFiltersOn] = useState(false)
  const [likedIds, setLikedIds] = useState(new Set())
  // Loaded once in init() and then NEVER modified. This is the server-side
  // exclusion list baked into every .range() query, so it has to stay frozen for
  // the whole session: adding an id mid-session shifts every later row down one,
  // so the next page starts one row late and silently skips a listing. Listings
  // hidden during the session go in sessionHidden and are filtered client-side.
  // Do NOT "fix" this by keeping it in sync with what the renter hides.
  const [hiddenIds, setHiddenIds] = useState([])
  // Hidden during this session. Filtered out of every incoming page so a listing
  // hidden earlier cannot reappear further down the feed.
  const [sessionHidden, setSessionHidden] = useState(new Set())
  const [prefs, setPrefs] = useState(null)
  const [tourListing, setTourListing] = useState(null)

  // setState is async, so a second observer firing before loadingMore lands in
  // state would start a duplicate page fetch. The ref is the real guard.
  const loadingMoreRef = useRef(false)
  const sentinelRef = useRef(null)

  useEffect(() => { init() }, [])

  async function init() {
    setLoading(true)

    const { data: swipeRows } = await supabase
      .from('swipes')
      .select('listing_id, liked, hidden')
      .eq('renter_id', user.id)

    setLikedIds(new Set((swipeRows || []).filter(s => s.liked).map(s => s.listing_id)))
    // Held in a local as well as state: the first fetchPage below needs it in
    // this same tick, before the state update has been applied.
    const hidden = (swipeRows || []).filter(s => s.hidden).map(s => s.listing_id)
    setHiddenIds(hidden)

    const { data: prefRow } = await supabase
      .from('renter_profiles')
      .select('budget_min, budget_max, bedrooms, sqft_min, neighborhoods')
      .eq('id', user.id)
      .maybeSingle()
    setPrefs(prefRow || null)

    // Filters start off: the feed shows everything active by default.
    const { rows, more } = await fetchPage(0, false, hidden)
    setListings(rows.filter(l => !sessionHidden.has(l.id)))
    setPage(0)
    setHasMore(more)
    setLoading(false)
  }

  async function fetchPage(pageNum, useFilters, hidden) {
    const PAGE = 10
    const from = pageNum * PAGE

    let query = supabase
      .from('listings')
      .select('*, profiles(name, email, phone)')
      .eq('status', 'active')

    // Only hidden listings are excluded. A liked listing stays in the feed.
    if (hidden.length > 0) {
      query = query.not('id', 'in', `(${hidden.join(',')})`)
    }

    if (useFilters && prefs) {
      if (prefs.budget_min > 0) query = query.gte('price', prefs.budget_min)
      if (prefs.budget_max > 0) query = query.lte('price', prefs.budget_max)
      if (prefs.bedrooms > 0) query = query.gte('bedrooms', prefs.bedrooms)

      // Unknown sqft passes — "exclude only if we know it's too small".
      // This must be server-side: filtering after .range() would punch holes in
      // the pages and break infinite scroll.
      if (prefs.sqft_min > 0) {
        query = query.or(`sqft.is.null,sqft.gte.${prefs.sqft_min}`)
      }

      // Values are double-quoted because neighborhood names contain spaces and
      // could contain commas, which are PostgREST's or() separator.
      const hoods = (prefs.neighborhoods || []).map(n => n.trim()).filter(Boolean)
      if (hoods.length > 0) {
        query = query.or(hoods.map(h => `neighborhood.ilike."${h}"`).join(','))
      }
    }

    // Stable ordering is mandatory. Without it Postgres may return rows in a
    // different order per request, and .range() paging would then repeat and
    // skip listings. id is the tiebreaker for listings sharing a timestamp.
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + PAGE - 1)

    if (error) {
      console.error('Feed fetch failed:', error)
      toast.error('Could not load listings')
      return { rows: [], more: false }
    }

    return { rows: data || [], more: (data || []).length === PAGE }
  }

  async function loadMore() {
    if (loadingMoreRef.current || loading || !hasMore) return
    loadingMoreRef.current = true
    setLoadingMore(true)

    const next = page + 1
    const { rows, more } = await fetchPage(next, filtersOn, hiddenIds)

    // `more` is the RAW row count from fetchPage, deliberately not the filtered
    // length — a page that filters down to 9 would otherwise end the feed early.
    setListings(prev => [...prev, ...rows.filter(l => !sessionHidden.has(l.id))])
    setPage(next)
    setHasMore(more)
    setLoadingMore(false)
    loadingMoreRef.current = false
  }

  // Sentinel at the bottom of the list. rootMargin gives it a head start so the
  // next page is usually already in flight by the time the user reaches the end.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, page, filtersOn, hiddenIds, sessionHidden, listings.length])

  async function toggleFilters() {
    const next = !filtersOn
    setFiltersOn(next)
    setLoading(true)
    setListings([])
    setPage(0)

    const { rows, more } = await fetchPage(0, next, hiddenIds)
    setListings(rows.filter(l => !sessionHidden.has(l.id)))
    setHasMore(more)
    setLoading(false)
  }

  async function toggleLike(listing) {
    const wasLiked = likedIds.has(listing.id)

    // `hidden` is deliberately not passed — liking must not disturb a hide.
    const { error } = await supabase
      .from('swipes')
      .upsert({
        renter_id: user.id,
        listing_id: listing.id,
        liked: !wasLiked,
      }, { onConflict: 'renter_id,listing_id' })

    if (error) {
      console.error('Like failed:', error)
      toast.error('Could not save that — try again')
      return
    }

    setLikedIds(prev => {
      const next = new Set(prev)
      if (wasLiked) next.delete(listing.id)
      else next.add(listing.id)
      return next
    })
  }

  async function hideListing(listing) {
    // `liked` is deliberately not passed — hiding preserves an existing like,
    // so un-hiding later restores it to Saved intact.
    const { error } = await supabase
      .from('swipes')
      .upsert({
        renter_id: user.id,
        listing_id: listing.id,
        hidden: true,
      }, { onConflict: 'renter_id,listing_id' })

    if (error) {
      console.error('Hide failed:', error)
      toast.error('Could not hide that — try again')
      return
    }

    setSessionHidden(prev => new Set(prev).add(listing.id))
    setListings(prev => prev.filter(l => l.id !== listing.id))
    toast.success('Hidden from your feed')
  }

  // Only offer the filter toggle to renters who actually saved a preference.
  const hasPrefs = !!prefs && (
    prefs.budget_min > 0 || prefs.budget_max > 0 ||
    prefs.bedrooms > 0 || prefs.sqft_min > 0 ||
    (prefs.neighborhoods || []).map(n => (n || '').trim()).filter(Boolean).length > 0
  )

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '90px' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)',
        padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 600, color: 'var(--terracotta)',
        }}>
          cuna
        </div>

        {hasPrefs && (
          <button
            onClick={toggleFilters}
            style={{
              padding: '8px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
              background: filtersOn ? 'var(--terracotta)' : 'var(--white)',
              color: filtersOn ? 'white' : 'var(--warm-gray)',
              border: `1px solid ${filtersOn ? 'var(--terracotta)' : 'var(--sand-dark)'}`,
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <Filter size={14} />
            My filters
          </button>
        )}
      </div>

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '20px 24px' }}>
        {loading ? (
          <div className="center" style={{ padding: '80px 0' }}>
            <div className="spinner" />
          </div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', marginBottom: '12px' }}>
              {filtersOn ? 'No listings match your filters' : 'No listings available yet'}
            </h2>
            <p style={{ color: 'var(--warm-gray)', marginBottom: '24px' }}>
              {filtersOn
                ? 'Turn filters off to see everything, or widen your search preferences in Profile.'
                : 'Check back soon for new listings.'}
            </p>
            {filtersOn && (
              <button className="btn-primary" onClick={toggleFilters}>Show all listings</button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {listings.map(listing => (
              <FeedCard
                key={listing.id}
                listing={listing}
                liked={likedIds.has(listing.id)}
                onToggleLike={toggleLike}
                onHide={hideListing}
                onRequestTour={setTourListing}
                onOpen={l => navigate('/listing/' + l.id)}
              />
            ))}

            <div ref={sentinelRef} style={{ height: '1px' }} />

            {loadingMore && (
              <div className="center" style={{ padding: '12px 0' }}>
                <div className="spinner" />
              </div>
            )}

            {!hasMore && !loadingMore && (
              <p style={{
                textAlign: 'center', fontSize: '13px', color: 'var(--warm-gray)', padding: '8px 0 0',
              }}>
                You're all caught up.
              </p>
            )}

            <FairHousingNotice compact />
          </div>
        )}
      </div>

      {tourListing && (
        <RequestTour listing={tourListing} onClose={() => setTourListing(null)} />
      )}

      <BottomNav />
    </div>
  )
}
