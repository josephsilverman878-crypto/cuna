import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { attachPosterContacts } from '../lib/posterContacts'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import RequestTour from '../components/RequestTour'
import FairHousingNotice from '../components/FairHousingNotice'
import NotificationBell from '../components/NotificationBell'
import FilterSheet from '../components/FilterSheet'
import FeedMap from '../components/FeedMap'
import { getNextOpenHouses, openHouseDayTag } from '../lib/openHouses'
import { petsPolicyLabel } from '../lib/petsPolicy'
import { getMySwipes, setLiked, setHidden } from '../lib/swipes'
import {
  SORTS, DEFAULT_SORT, EMPTY_FILTERS, normalizeFilters, countActiveFilters, describeFilters,
  searchListings, searchListingPoints, loadSearchState, saveSearchState, filtersForServer,
} from '../lib/search'
import { listNeighborhoods, idsForNames } from '../lib/areas'
import { createSavedSearch, getSavedSearch } from '../lib/savedSearches'
import { mapsEnabled } from '../lib/mapbox'
import { hasConcession, concessionText } from '../lib/netEffective'
import toast from 'react-hot-toast'
import {
  MapPin, BedDouble, Bath, Maximize2, ChevronLeft, ChevronRight, Heart, MoreVertical, EyeOff,
  SlidersHorizontal, Map as MapIcon, List, BookmarkPlus, X,
} from 'lucide-react'

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80'
const PAGE = 10

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

        {listing.next_open_house && (
          <div style={{
            position: 'absolute', bottom: '14px', right: '16px',
            background: 'rgba(255,255,255,0.92)', color: 'var(--charcoal)',
            padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
          }}>
            {openHouseDayTag(listing.next_open_house.starts_at)}
          </div>
        )}

        {listing.status === 'in_contract' && (
          <div style={{
            position: 'absolute', bottom: '14px', left: '16px',
            background: 'rgba(44,36,32,0.82)', color: 'white',
            padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
          }}>
            In contract
          </div>
        )}

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
          {hasConcession(listing) && (
            <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--charcoal-soft)' }}>
              <strong style={{ color: 'var(--like-green)' }}>${Number(listing.net_effective_price).toLocaleString()}/mo net effective</strong>
              <span style={{ color: 'var(--warm-gray)' }}> · {concessionText(listing)} · ${Number(listing.price).toLocaleString()} gross</span>
            </div>
          )}
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

// The search criteria as one object, so a change to any part resets paging
// and (debounced) lands in renter_profiles.search_state.
function criteriaFromState(state) {
  return {
    filters: normalizeFilters(state?.filters),
    sort: SORTS.some(s => s.id === state?.sort) ? state.sort : DEFAULT_SORT,
    neighborhoodIds: Array.isArray(state?.neighborhood_ids) ? state.neighborhood_ids.filter(Boolean) : [],
    area: state?.area && state.area.type === 'Polygon' ? state.area : null,
    view: state?.view === 'map' ? 'map' : 'list',
  }
}

// Seeds the first-ever criteria from the older Profile preferences so a
// renter who set a budget there keeps seeing it applied.
function criteriaFromPrefs(prefs, neighborhoods) {
  if (!prefs) return null
  const filters = { ...EMPTY_FILTERS }
  if (prefs.budget_min > 0) filters.price_min = String(prefs.budget_min)
  if (prefs.budget_max > 0) filters.price_max = String(prefs.budget_max)
  if (prefs.bedrooms > 0) filters.beds_min = String(prefs.bedrooms)
  if (prefs.sqft_min > 0) filters.sqft_min = String(prefs.sqft_min)
  const neighborhoodIds = idsForNames(neighborhoods, prefs.neighborhoods)
  if (countActiveFilters(filters, neighborhoodIds) === 0) return null
  return { filters, sort: DEFAULT_SORT, neighborhoodIds, area: null, view: 'list' }
}

export default function Feed() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [listings, setListings] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [likedIds, setLikedIds] = useState(new Set())
  // Loaded once in init() and then NEVER modified. This is the server-side
  // exclusion list baked into every page query (p_exclude), so it has to stay
  // frozen for the whole session: adding an id mid-session shifts every later
  // row down one, so the next page starts one row late and silently skips a
  // listing. Listings hidden during the session go in sessionHidden and are
  // filtered client-side. Do NOT "fix" this by keeping it in sync with what
  // the renter hides.
  const [hiddenIds, setHiddenIds] = useState([])
  // Hidden during this session. Filtered out of every incoming page so a listing
  // hidden earlier cannot reappear further down the feed.
  const [sessionHidden, setSessionHidden] = useState(new Set())
  const [tourListing, setTourListing] = useState(null)

  const [criteria, setCriteria] = useState(() => criteriaFromState(null))
  const [neighborhoods, setNeighborhoods] = useState([])
  const [points, setPoints] = useState([])
  const [pointsCount, setPointsCount] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)
  const [ready, setReady] = useState(false)

  // setState is async, so a second observer firing before loadingMore lands in
  // state would start a duplicate page fetch. The ref is the real guard.
  const loadingMoreRef = useRef(false)
  const sentinelRef = useRef(null)
  const requestSeq = useRef(0)
  const persistTimer = useRef(null)
  const criteriaRef = useRef(criteria)
  criteriaRef.current = criteria

  useEffect(() => { init() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function init() {
    setLoading(true)

    const [{ data: swipeRows }, hoods, saved] = await Promise.all([
      getMySwipes(user.id, 'listing_id, liked, hidden'),
      listNeighborhoods().catch(err => { console.error('Neighborhoods could not load:', err); return [] }),
      loadSearchState(user.id),
    ])
    setNeighborhoods(hoods)

    setLikedIds(new Set((swipeRows || []).filter(s => s.liked).map(s => s.listing_id)))
    // Held in a local as well as state: the first fetchPage below needs it in
    // this same tick, before the state update has been applied.
    const hidden = (swipeRows || []).filter(s => s.hidden).map(s => s.listing_id)
    setHiddenIds(hidden)

    // Last-used criteria, or a first seed from the Profile preferences.
    let next = saved.state ? criteriaFromState(saved.state) : (criteriaFromPrefs(saved.prefs, hoods) || criteriaFromState(null))

    // ?saved=<id> from Profile applies that saved search.
    const savedId = searchParams.get('saved')
    if (savedId) {
      const { data: ss } = await getSavedSearch(user.id, savedId)
      if (ss) {
        next = criteriaFromState({ filters: ss.filters, sort: next.sort, neighborhood_ids: ss.neighborhood_ids, area: ss.area_geojson, view: ss.area_geojson || ss.neighborhood_ids?.length ? 'map' : next.view })
        toast.success(`Showing "${ss.name}"`)
      }
      setSearchParams({}, { replace: true })
    }

    setCriteria(next)
    setReady(true)
    await runSearch(next, hidden)
  }

  async function fetchPage(pageNum, crit, hidden) {
    const { data, error } = await searchListings({
      filters: crit.filters, neighborhoodIds: crit.neighborhoodIds, area: crit.area, sort: crit.sort,
      exclude: hidden, page: pageNum, pageSize: PAGE,
    })
    if (error) {
      console.error('Feed fetch failed:', error)
      toast.error('Could not load listings')
      return { rows: [], more: false }
    }
    // hasMore is computed from the RAW row count, before contacts are attached,
    // so it still reflects what the server returned.
    const more = (data || []).length === PAGE
    const withContacts = await attachPosterContacts(data || [])
    // Next upcoming open house per card, for the "Open house Sat" tag.
    const nextOpenHouse = await getNextOpenHouses(withContacts.map(l => l.id))
    return { rows: withContacts.map(l => ({ ...l, next_open_house: nextOpenHouse[l.id] || null })), more }
  }

  // A new search from page 0. Later responses to an older search are dropped.
  async function runSearch(crit, hidden) {
    const seq = ++requestSeq.current
    setLoading(true)
    setListings([])
    setPage(0)
    setHasMore(false)
    const [{ rows, more }, pts] = await Promise.all([
      fetchPage(0, crit, hidden),
      crit.view === 'map' ? loadPoints(crit, hidden) : Promise.resolve(null),
    ])
    if (seq !== requestSeq.current) return
    setListings(rows.filter(l => !sessionHidden.has(l.id)))
    setPage(0)
    setHasMore(more)
    if (pts) { setPoints(pts.points); setPointsCount(pts.count) }
    setLoading(false)
  }

  async function loadPoints(crit, hidden) {
    const { data, error } = await searchListingPoints({
      filters: crit.filters, neighborhoodIds: crit.neighborhoodIds, area: crit.area, exclude: hidden,
    })
    if (error) { console.error('Map points failed:', error); return { points: [], count: null } }
    const pts = (data || []).filter(p => !sessionHidden.has(p.id))
    return { points: pts, count: pts.length }
  }

  async function loadMore() {
    if (loadingMoreRef.current || loading || !hasMore) return
    loadingMoreRef.current = true
    setLoadingMore(true)

    const next = page + 1
    const seq = requestSeq.current
    const { rows, more } = await fetchPage(next, criteriaRef.current, hiddenIds)
    if (seq !== requestSeq.current) { loadingMoreRef.current = false; setLoadingMore(false); return }

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
  }, [hasMore, loading, page, criteria, hiddenIds, sessionHidden, listings.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Every criteria change: new search, and the state is remembered (debounced).
  function applyCriteria(patch, { refetch = true } = {}) {
    const next = { ...criteriaRef.current, ...patch }
    setCriteria(next)
    if (refetch) runSearch(next, hiddenIds)
    else if (next.view === 'map' && patch.view === 'map') loadPoints(next, hiddenIds).then(p => { setPoints(p.points); setPointsCount(p.count) })
    clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => {
      saveSearchState(user.id, {
        filters: filtersForServer(next.filters), sort: next.sort,
        neighborhood_ids: next.neighborhoodIds, area: next.area, view: next.view,
      }).then(({ error }) => { if (error) console.error('Search state not saved:', error) })
    }, 800)
  }

  const toggleArea = useCallback((id) => {
    const ids = criteriaRef.current.neighborhoodIds
    const next = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    applyCriteria({ neighborhoodIds: next })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function clearAreas() { applyCriteria({ neighborhoodIds: [], area: null }) }
  function setView(view) { applyCriteria({ view }, { refetch: false }) }

  async function toggleLike(listing) {
    const wasLiked = likedIds.has(listing.id)

    // `hidden` is deliberately not passed — liking must not disturb a hide.
    const { error } = await setLiked(user.id, listing.id, !wasLiked)

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
    const { error } = await setHidden(user.id, listing.id, true)

    if (error) {
      console.error('Hide failed:', error)
      toast.error('Could not hide that — try again')
      return
    }

    setSessionHidden(prev => new Set(prev).add(listing.id))
    setListings(prev => prev.filter(l => l.id !== listing.id))
    setPoints(prev => prev.filter(p => p.id !== listing.id))
    toast.success('Hidden from your feed')
  }

  async function saveSearch() {
    const name = saveName.trim()
    if (!name) { toast.error('Give the search a name'); return }
    setSaving(true)
    const { error } = await createSavedSearch(user.id, {
      name, filters: criteria.filters, neighborhoodIds: criteria.neighborhoodIds, area: criteria.area,
    })
    setSaving(false)
    if (error) {
      console.error('Save search failed:', error)
      toast.error(error.message || 'Could not save the search')
      return
    }
    setSaveOpen(false)
    toast.success("Saved. You'll get a bell notification when a new listing matches.")
  }

  const hoodById = useMemo(() => new Map(neighborhoods.map(n => [n.id, n])), [neighborhoods])
  const selectedNames = criteria.neighborhoodIds.map(id => hoodById.get(id)?.name).filter(Boolean)
  const activeCount = countActiveFilters(criteria.filters, criteria.neighborhoodIds, criteria.area)
  const sortLabel = SORTS.find(s => s.id === criteria.sort)?.label || 'Newest'
  const summary = describeFilters(criteria.filters, selectedNames, Boolean(criteria.area))
  const selectedSet = useMemo(() => new Set(criteria.neighborhoodIds), [criteria.neighborhoodIds])
  const showMap = criteria.view === 'map' && mapsEnabled()

  const pill = (active) => ({
    padding: '8px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
    background: active ? 'var(--terracotta)' : 'var(--white)',
    color: active ? 'white' : 'var(--charcoal-soft)',
    border: `1px solid ${active ? 'var(--terracotta)' : 'var(--sand-dark)'}`,
    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
    whiteSpace: 'nowrap',
  })

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '90px' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)',
        padding: '12px 16px', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 600, color: 'var(--terracotta)' }}>
            cuna
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NotificationBell />
            <button onClick={() => setFiltersOpen(true)} style={pill(activeCount > 0)} aria-label="Filters">
              <SlidersHorizontal size={14} />
              Filters{activeCount > 0 ? ` · ${activeCount}` : ''}
            </button>
            {mapsEnabled() && (
              <button
                onClick={() => setView(criteria.view === 'map' ? 'list' : 'map')}
                style={pill(criteria.view === 'map')}
                aria-label={criteria.view === 'map' ? 'Show list' : 'Show map'}
              >
                {criteria.view === 'map' ? <List size={14} /> : <MapIcon size={14} />}
                {criteria.view === 'map' ? 'List' : 'Map'}
              </button>
            )}
          </div>
        </div>
        {ready && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', overflowX: 'auto', fontSize: '12px', color: 'var(--warm-gray)' }}>
            <span style={{ whiteSpace: 'nowrap' }}>{sortLabel}</span>
            <span>·</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{summary}</span>
            {activeCount > 0 && (
              <>
                <button onClick={() => { setSaveName(summary.slice(0, 60)); setSaveOpen(true) }} style={{ ...pill(false), padding: '5px 10px', fontSize: '12px' }} aria-label="Save this search">
                  <BookmarkPlus size={13} /> Save search
                </button>
                <button onClick={() => applyCriteria({ filters: { ...EMPTY_FILTERS }, neighborhoodIds: [], area: null })} style={{ ...pill(false), padding: '5px 10px', fontSize: '12px' }} aria-label="Clear all filters">
                  <X size={13} /> Clear
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '16px 16px 20px' }}>
        {showMap && (
          <div style={{ marginBottom: '16px' }}>
            <FeedMap
              points={points}
              selectedIds={selectedSet}
              onToggleArea={toggleArea}
              area={criteria.area}
              onAreaChange={polygon => applyCriteria({ area: polygon })}
              onClear={clearAreas}
              onOpenListing={id => navigate('/listing/' + id)}
            />
            <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: '8px 2px 0' }}>
              {pointsCount === null ? 'Pins show every listing that matches your filters.'
                : pointsCount === 0 ? 'No listings with a map location match yet.'
                : `${pointsCount} listing${pointsCount === 1 ? '' : 's'} on the map · tap a pin to open it`}
            </p>
          </div>
        )}

        {loading ? (
          <div className="center" style={{ padding: '80px 0' }}>
            <div className="spinner" />
          </div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', marginBottom: '12px' }}>
              {activeCount > 0 ? 'No listings match your search' : 'No listings available yet'}
            </h2>
            <p style={{ color: 'var(--warm-gray)', marginBottom: '24px' }}>
              {activeCount > 0
                ? 'Widen the filters, pick more neighborhoods, or save this search and we will tell you when something new matches.'
                : 'Check back soon for new listings.'}
            </p>
            {activeCount > 0 && (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn-secondary" onClick={() => { setSaveName(summary.slice(0, 60)); setSaveOpen(true) }}>Save this search</button>
                <button className="btn-primary" onClick={() => applyCriteria({ filters: { ...EMPTY_FILTERS }, neighborhoodIds: [], area: null })}>Show all listings</button>
              </div>
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

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={criteria.filters}
        sort={criteria.sort}
        neighborhoods={neighborhoods}
        selectedIds={selectedSet}
        onApply={({ filters, sort, neighborhoodIds }) => applyCriteria({ filters, sort, neighborhoodIds })}
      />

      {saveOpen && (
        <>
          <div onClick={() => setSaveOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(44,36,32,0.45)', zIndex: 200 }} />
          <div role="dialog" aria-modal="true" aria-label="Save this search" style={{
            position: 'fixed', left: '16px', right: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 201,
            background: 'var(--white)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', padding: '20px',
            maxWidth: '420px', margin: '0 auto',
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', margin: '0 0 6px' }}>Save this search</h2>
            <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: '0 0 14px', lineHeight: 1.5 }}>
              {summary}. You'll get a bell notification whenever a new listing matches.
            </p>
            <input
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              maxLength={80}
              placeholder="Name this search"
              aria-label="Search name"
              onKeyDown={e => { if (e.key === 'Enter') saveSearch() }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button className="btn-secondary" onClick={() => setSaveOpen(false)} style={{ flex: 1, padding: '12px' }}>Cancel</button>
              <button className="btn-primary" onClick={saveSearch} disabled={saving} style={{ flex: 1, padding: '12px', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </>
      )}

      {tourListing && (
        <RequestTour listing={tourListing} onClose={() => setTourListing(null)} />
      )}

      <BottomNav />
    </div>
  )
}
