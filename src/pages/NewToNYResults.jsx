import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Train, Clock, Check, Info, Mail, BedDouble, Bath, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { STORAGE_KEY, describeAnswers } from '../lib/quizQuestions'
import { NEIGHBORHOODS } from '../lib/neighborhoods'
import { matchNeighborhoods, askedPriceRange } from '../lib/neighborhoodMatch'
import { fetchListingsForNeighborhoods } from '../lib/listingsForNeighborhood'

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80'
const INQUIRY_EMAIL = 'Info@SLRGRP.com'
// Top 3 get cards; the rest are candidates for "Nearby with listings".
const SHOWN = 3
const LOOKUP_DEPTH = 10
const RESULTS_PATH = '/new-to-ny/results'

// A save the visitor asked for before signing in. Survives the trip to /login
// (and to /register, which lands them elsewhere) and completes on return.
const PENDING_SAVE_KEY = 'cuna_newtony_pending_save'
const PENDING_SAVE_TTL_MS = 60 * 60 * 1000 // 1 hour

function readPendingSave() {
  try {
    const raw = window.localStorage.getItem(PENDING_SAVE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    const at = Date.parse(parsed?.at || '')
    if (!Number.isFinite(at) || Date.now() - at > PENDING_SAVE_TTL_MS) {
      window.localStorage.removeItem(PENDING_SAVE_KEY)
      return false
    }
    return true
  } catch {
    return false
  }
}

function writePendingSave() {
  try {
    window.localStorage.setItem(PENDING_SAVE_KEY, JSON.stringify({ at: new Date().toISOString() }))
  } catch {
    // Storage blocked: the visitor just presses Save again after signing in.
  }
}

function clearPendingSave() {
  try {
    window.localStorage.removeItem(PENDING_SAVE_KEY)
  } catch {
    // Nothing to do.
  }
}

function loadAnswers() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && parsed.answers && Object.keys(parsed.answers).length ? parsed.answers : null
  } catch {
    return null
  }
}

// Quiz answers only — budget, size, commute and pace. Nothing else goes in.
function mailtoLink(neighborhoodName, answers) {
  const wanted = ['budget', 'size', 'commute_to', 'commute_max', 'pace']
  const rows = describeAnswers(answers).filter(r => wanted.includes(r.id))
  const subject = `Looking in ${neighborhoodName}`
  const body = [
    `I am looking in ${neighborhoodName}. Here is what I told the Cuna quiz:`,
    '',
    ...rows.map(r => `${r.prompt} ${r.value}`),
    '',
    'Please let me know what you have.',
  ].join('\n')
  return `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function Shell({ children }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #F5F0E8 0%, #EDE6D6 100%)',
    }}>
      <header style={{ padding: '20px 24px' }}>
        <Link to="/" style={{
          fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 600,
          color: 'var(--terracotta)',
        }}>
          cuna
        </Link>
      </header>
      <main style={{ padding: '8px 24px 64px' }}>
        <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}

// Compact row. Feed.jsx's card is a full-width photo carousel, too heavy for a
// three-up preview, so this is its own smaller layout.
function ListingRow({ listing }) {
  const cover = listing.photos?.length > 0 ? listing.photos[0] : FALLBACK_PHOTO
  return (
    <Link
      to={'/listing/' + listing.id}
      style={{
        display: 'flex', gap: '12px', alignItems: 'stretch',
        border: '1px solid var(--sand-dark)', borderRadius: 'var(--radius-sm)',
        overflow: 'hidden', background: 'var(--white)',
      }}
    >
      <img
        src={cover}
        alt=""
        style={{ width: '84px', height: '84px', objectFit: 'cover', flexShrink: 0 }}
        onError={e => { e.target.src = FALLBACK_PHOTO }}
      />
      <div style={{ padding: '10px 12px 10px 0', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600,
          color: 'var(--terracotta)', lineHeight: 1.1,
        }}>
          ${listing.price?.toLocaleString()}<span style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>/mo</span>
        </div>
        <div style={{
          fontSize: '13px', color: 'var(--charcoal)', marginTop: '2px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {listing.address}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '12px', color: 'var(--charcoal-soft)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <BedDouble size={12} /> {listing.bedrooms}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Bath size={12} /> {listing.bathrooms}
          </span>
        </div>
      </div>
    </Link>
  )
}

// Ranks 4-10 while signed out: the name and borough are blurred, so the row
// shows that more matches exist without giving them away.
function LockedRow({ result, rank }) {
  const n = result.neighborhood
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '14px 16px', background: 'var(--white)',
      border: '1px solid var(--sand-dark)', borderRadius: 'var(--radius-sm)',
    }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--warm-gray)', flexShrink: 0 }}>
        #{rank}
      </span>
      <div aria-hidden="true" style={{ filter: 'blur(4px)', userSelect: 'none', flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, lineHeight: 1.2 }}>
          {n.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>{n.borough}</div>
      </div>
      <Lock size={15} color="var(--warm-gray)" style={{ flexShrink: 0 }} />
    </div>
  )
}

function Fallback({ neighborhood, answers, nearby, isBuyer }) {
  return (
    <div style={{
      border: '1px dashed var(--sand-dark)', borderRadius: 'var(--radius-sm)',
      padding: '14px', background: 'rgba(255,255,255,0.5)',
    }}>
      <p style={{ fontSize: '13px', color: 'var(--charcoal)', margin: '0 0 12px', lineHeight: 1.5 }}>
        {isBuyer
          ? "We don't have homes for sale in this neighborhood yet"
          : 'Nothing listed here right now.'}
      </p>

      <a
        href={mailtoLink(neighborhood.name, answers)}
        className="btn-secondary"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '13px', padding: '10px 18px', textDecoration: 'none',
        }}
      >
        <Mail size={14} />
        Tell us what you're looking for
      </a>

      {nearby.length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <div className="label" style={{ marginBottom: '6px' }}>Nearby with listings</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {nearby.map(n => (
              <span key={n.id} className="tag">
                {n.name} · {n.count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NeighborhoodCard({ result, answers, rank, listings, listingsLoading, listingsError, nearby }) {
  const n = result.neighborhood
  const priced = askedPriceRange(answers, n)
  const isBuyer = answers.tenure === 'buy'

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 600,
            lineHeight: 1.15, margin: 0,
          }}>
            {n.name}
          </h2>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--terracotta)', flexShrink: 0 }}>
            #{rank}
          </span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--warm-gray)', marginTop: '2px' }}>{n.borough}</div>
        <p style={{ fontSize: '14px', color: 'var(--charcoal-soft)', lineHeight: 1.6, margin: '14px 0 0' }}>
          {n.description}
        </p>
      </div>

      {result.reasons.length > 0 && (
        <div style={{ padding: '16px 20px 0' }}>
          <div className="label" style={{ marginBottom: '8px' }}>Why this fits</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {result.reasons.map(reason => (
              <li key={reason} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Check size={15} color="var(--like-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--charcoal)' }}>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.caveats.length > 0 && (
        <div style={{ padding: '16px 20px 0' }}>
          <div className="label" style={{ marginBottom: '8px' }}>Worth knowing</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {result.caveats.map(caveat => (
              <li key={caveat} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Info size={14} color="var(--warm-gray)" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--warm-gray)' }}>{caveat}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ padding: '18px 20px 0' }}>
        <div className="label" style={{ marginBottom: '8px' }}>Available with Silver Line</div>
        {listingsLoading ? (
          <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>Checking listings…</p>
        ) : listingsError ? (
          <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0, lineHeight: 1.5 }}>
            We couldn't load listings just now. The neighborhood match above still stands.
          </p>
        ) : listings.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {listings.map(listing => <ListingRow key={listing.id} listing={listing} />)}
          </div>
        ) : (
          <Fallback
            neighborhood={n}
            answers={answers}
            nearby={nearby}
            isBuyer={isBuyer}
          />
        )}
      </div>

      <div style={{
        margin: '18px 0 0', padding: '14px 20px',
        borderTop: '1px solid var(--sand-dark)',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        {priced && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px' }}>
            <span style={{ color: 'var(--warm-gray)' }}>{priced.label}</span>
            <span style={{ fontWeight: 600, color: 'var(--terracotta)', textAlign: 'right' }}>{priced.text}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px' }}>
          <Train size={14} color="var(--warm-gray)" style={{ flexShrink: 0, marginTop: '3px' }} />
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {n.subway_lines.map(line => (
              <span key={line} className="tag" style={{ padding: '2px 8px', fontSize: '11px' }}>{line}</span>
            ))}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--charcoal-soft)' }}>
          <Clock size={14} color="var(--warm-gray)" style={{ flexShrink: 0 }} />
          <span>
            ~{n.commute_minutes.midtown} min to Midtown · ~{n.commute_minutes.downtown_fidi} min to the Financial District
          </span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--warm-gray)', fontStyle: 'italic' }}>
          {n.data_note}
        </div>
      </div>
    </div>
  )
}

export default function NewToNYResults() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [answers, setAnswers] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error
  // Guards the deferred save so it runs once, not on every re-render.
  const autoSaveRan = useRef(false)
  const [listingsByHood, setListingsByHood] = useState({})
  const [listingsLoading, setListingsLoading] = useState(false)
  const [listingsError, setListingsError] = useState(false)

  useEffect(() => {
    setAnswers(loadAnswers())
    setLoaded(true)
  }, [])

  const results = useMemo(
    () => (answers ? matchNeighborhoods(answers, NEIGHBORHOODS) : []),
    [answers]
  )

  // Completes a save the visitor asked for before signing in. Nothing is ever
  // written without that earlier button press.
  useEffect(() => {
    if (autoSaveRan.current) return
    if (!answers || !user || profile?.role !== 'renter') return
    if (!readPendingSave()) return
    autoSaveRan.current = true
    clearPendingSave()
    setSaveState('saving')
    const now = new Date().toISOString()
    supabase
      .from('renter_profiles')
      .upsert({ id: user.id, quiz_answers: answers, quiz_saved_at: now, updated_at: now })
      .then(({ error }) => {
        if (error) throw error
        setSaveState('saved')
      })
      .catch(err => {
        console.error('Saving quiz answers failed:', err)
        setSaveState('error')
      })
  }, [answers, user, profile?.role])

  useEffect(() => {
    if (!answers || results.length === 0) return
    let cancelled = false
    const ids = results.slice(0, LOOKUP_DEPTH).map(r => r.neighborhood.id)
    setListingsLoading(true)
    setListingsError(false)
    fetchListingsForNeighborhoods(ids, answers)
      .then(map => { if (!cancelled) setListingsByHood(map) })
      .catch(err => {
        // Quiet failure: the neighborhood results are still worth showing.
        console.error('Listings fetch failed:', err)
        if (!cancelled) setListingsError(true)
      })
      .finally(() => { if (!cancelled) setListingsLoading(false) })
    return () => { cancelled = true }
  }, [answers, results])

  const isPoster = profile?.role === 'poster'
  const isRenter = profile?.role === 'renter'
  // Posters get every result and no save option; everyone else may save.
  const canSave = !user || isRenter

  async function persist(toSave) {
    setSaveState('saving')
    try {
      const now = new Date().toISOString()
      // Same upsert shape Profile.jsx uses: the row's primary key is the user id.
      const { error } = await supabase.from('renter_profiles').upsert({
        id: user.id,
        quiz_answers: toSave,
        quiz_saved_at: now,
        updated_at: now,
      })
      if (error) throw error
      setSaveState('saved')
    } catch (err) {
      console.error('Saving quiz answers failed:', err)
      setSaveState('error')
    }
  }

  function handleSave() {
    if (saveState === 'saving' || saveState === 'saved') return
    if (!user) {
      // Remember the intent, then use the app's existing sign-in round trip.
      writePendingSave()
      navigate(`/login?next=${encodeURIComponent(RESULTS_PATH)}`)
      return
    }
    if (!isRenter) return
    clearPendingSave()
    persist(answers)
  }

  if (!loaded) return <Shell>{null}</Shell>

  if (!answers) {
    return (
      <Shell>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 6.5vw, 44px)',
          fontWeight: 500, lineHeight: 1.1, marginBottom: '12px',
        }}>
          No answers saved yet
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--warm-gray)', lineHeight: 1.6, marginBottom: '28px' }}>
          Take the quiz and we'll show you the neighborhoods that fit.
        </p>
        <button className="btn-primary" onClick={() => navigate('/new-to-ny')}>Take the quiz</button>
      </Shell>
    )
  }

  const top = results.slice(0, SHOWN)
  const summary = describeAnswers(answers)

  // Any ranked neighborhood that actually has listings, for the fallback block.
  const withListings = results
    .map(r => ({
      id: r.neighborhood.id,
      name: r.neighborhood.name,
      count: (listingsByHood[r.neighborhood.id] || []).length,
    }))
    .filter(x => x.count > 0)

  return (
    <Shell>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 6.5vw, 44px)',
        fontWeight: 500, lineHeight: 1.1, marginBottom: '10px',
      }}>
        {top.length ? 'Your neighborhoods' : 'No matches yet'}
      </h1>

      {top.length > 0 ? (
        <>
          <p style={{ fontSize: '15px', color: 'var(--warm-gray)', lineHeight: 1.6, marginBottom: '20px' }}>
            Based on what you told us, these {top.length === 1 ? 'is the closest fit' : `${top.length} fit best`}.
          </p>

          {canSave && (
            <div style={{ marginBottom: '28px' }}>
              <button
                className={saveState === 'saved' ? 'btn-secondary' : 'btn-primary'}
                onClick={handleSave}
                disabled={saveState === 'saving' || saveState === 'saved'}
                style={{ opacity: saveState === 'saving' ? 0.7 : 1 }}
              >
                {saveState === 'saving'
                  ? 'Saving…'
                  : saveState === 'saved'
                  ? 'Saved to your account'
                  : 'Save my results'}
              </button>
              {saveState === 'error' && (
                <p style={{ fontSize: '13px', color: 'var(--pass-red)', margin: '10px 0 0' }}>
                  We couldn't save your results just now. Try again.
                </p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {top.map((result, i) => (
              <NeighborhoodCard
                key={result.neighborhood.id}
                result={result}
                answers={answers}
                rank={i + 1}
                listings={listingsByHood[result.neighborhood.id] || []}
                listingsLoading={listingsLoading}
                listingsError={listingsError}
                nearby={withListings.filter(x => x.id !== result.neighborhood.id).slice(0, 4)}
              />
            ))}
          </div>

          {results.length > SHOWN && (
            <div style={{ marginTop: '28px' }}>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600,
                margin: '0 0 12px',
              }}>
                See more neighborhoods
              </h2>

              {user ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {results.slice(SHOWN, LOOKUP_DEPTH).map((result, i) => (
                    <NeighborhoodCard
                      key={result.neighborhood.id}
                      result={result}
                      answers={answers}
                      rank={SHOWN + i + 1}
                      listings={listingsByHood[result.neighborhood.id] || []}
                      listingsLoading={listingsLoading}
                      listingsError={listingsError}
                      nearby={withListings.filter(x => x.id !== result.neighborhood.id).slice(0, 4)}
                    />
                  ))}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {results.slice(SHOWN, LOOKUP_DEPTH).map((result, i) => (
                      <LockedRow key={result.neighborhood.id} result={result} rank={SHOWN + i + 1} />
                    ))}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <p style={{ fontSize: '14px', color: 'var(--warm-gray)', margin: '0 0 12px', lineHeight: 1.5 }}>
                      Sign in to see all your matches.
                    </p>
                    <button
                      className="btn-secondary"
                      onClick={() => navigate(`/login?next=${encodeURIComponent(RESULTS_PATH)}`)}
                    >
                      Sign in
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '15px', color: 'var(--charcoal)', lineHeight: 1.6, marginBottom: '8px' }}>
            Nothing in our current data fits that budget. Try adjusting it.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--warm-gray)', lineHeight: 1.6, marginBottom: '20px' }}>
            We would rather show you nothing than a place you cannot afford.
          </p>
          <button className="btn-primary" onClick={() => navigate('/new-to-ny')}>Adjust your answers</button>
        </div>
      )}

      <details style={{ marginTop: '28px' }}>
        <summary style={{
          cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: 'var(--terracotta)',
          padding: '10px 0', listStyle: 'revert',
        }}>
          Your answers
        </summary>
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '10px' }}>
          {summary.map((row, i) => (
            <div key={row.id} style={{
              padding: '12px 16px',
              borderTop: i === 0 ? 'none' : '1px solid var(--sand-dark)',
            }}>
              <div className="label" style={{ marginBottom: '3px' }}>{row.prompt}</div>
              <div style={{ fontSize: '14px', color: 'var(--charcoal)', lineHeight: 1.5 }}>{row.value}</div>
            </div>
          ))}
        </div>
      </details>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
        <button className="btn-secondary" onClick={() => navigate('/new-to-ny')}>Retake the quiz</button>
      </div>
    </Shell>
  )
}
