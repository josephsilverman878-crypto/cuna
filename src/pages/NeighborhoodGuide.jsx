import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { aiRequest } from '../lib/ai'
import { createSavedSearch } from '../lib/savedSearches'
import { normalizeFilters } from '../lib/search'
import { ROUTE_COLORS, DARK_TEXT_ROUTES } from '../lib/subway'
import AiLabel from '../components/AiLabel'
import FairHousingNotice from '../components/FairHousingNotice'

// /new-to-ny when the assistant is on (AI phase 2). The person describes what
// they want in their own words; /api/ai returns 3 to 5 neighborhoods from
// Cuna's own table with reasons, figures (each with its source) and subway
// lines. The classic step-by-step quiz stays at /new-to-ny/classic and is
// what /new-to-ny shows when the assistant is off.
//
// What the person typed and what came back live in sessionStorage only, so
// they survive a sign-in round trip and vanish when the tab closes. Nothing
// is saved to the account unless they tap "Save this search".

const STORE_KEY = 'cuna_guide_v1'
const CLASSIC = '/new-to-ny/classic'
const BEDROOMS = [['studio', 'Studio'], ['1', '1 bed'], ['2', '2 beds'], ['3+', '3+ beds']]
const EMPTY_HINTS = { budget: '', bedrooms: '', commute: '', must_haves: '' }
const WANT_LABELS = {
  quiet: 'Calm streets', lively: 'Busy streets', nightlife: 'Nightlife', dining: 'Dining', green_space: 'Parks',
  walkable: 'Walkable', transit: 'Close to the subway', car_friendly: 'Car-friendly',
}

function loadStored() {
  try {
    const raw = sessionStorage.getItem(STORE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function money(n) {
  return '$' + Math.round(Number(n)).toLocaleString('en-US')
}

function criteriaChips(result) {
  const c = result?.criteria
  if (!c) return []
  const chips = []
  if (c.budget_max != null) chips.push(`Up to ${money(c.budget_max)}${result.mode === 'buy' ? '' : ' a month'}`)
  if (c.bedrooms) chips.push(c.bedrooms === 'studio' ? 'Studio' : `${c.bedrooms} bedroom${c.bedrooms === '1' ? '' : 's'}`)
  if (result.destination?.label) chips.push(`Getting to ${result.destination.label}`)
  for (const b of c.boroughs || []) chips.push(b)
  if (c.lines?.length) chips.push(`${c.lines.join(', ')} train${c.lines.length > 1 ? 's' : ''}`)
  for (const w of c.wants || []) chips.push(WANT_LABELS[w] || w)
  for (const m of c.must_haves || []) chips.push(m)
  return chips
}

function Bullet({ route }) {
  return (
    <span aria-label={`${route} train`} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '22px', height: '22px',
      padding: route.length > 1 ? '0 6px' : 0, borderRadius: '11px', fontSize: '12px', fontWeight: 700,
      background: ROUTE_COLORS[route] || '#808183', color: DARK_TEXT_ROUTES.has(route) ? '#2C2420' : 'white',
    }}>{route}</span>
  )
}

const card = { background: 'var(--white)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: 'var(--shadow-sm)' }
const input = {
  width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--sand-dark)',
  background: 'var(--white)', fontSize: '15px', fontFamily: 'var(--font-body)', color: 'var(--charcoal)',
}
const label = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--warm-gray)', margin: '14px 0 6px' }

export default function NeighborhoodGuide() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const stored = useRef(loadStored()).current
  const [mode, setMode] = useState(stored?.mode === 'buy' ? 'buy' : 'rent')
  const [text, setText] = useState(stored?.text || '')
  const [hints, setHints] = useState({ ...EMPTY_HINTS, ...(stored?.hints || {}) })
  const [detailsOpen, setDetailsOpen] = useState(Boolean(stored?.hints && Object.values(stored.hints).some(Boolean)))
  const [result, setResult] = useState(stored?.result || null)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)
  const [followup, setFollowup] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedOnce, setSavedOnce] = useState(false)
  const resultsRef = useRef(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify({ mode, text, hints, result }))
    } catch { /* private mode: the page still works, it just will not survive a reload */ }
  }, [mode, text, hints, result])

  const canAsk = text.trim().length > 0 || Object.values(hints).some(v => String(v).trim())

  async function ask(payload) {
    setBusy(true)
    setMessage(null)
    const r = await aiRequest('guide', payload)
    setBusy(false)
    if (r.reason === 'aborted') return
    if (!r.ok) { setMessage({ text: r.message, classic: true }); return }
    if (r.output?.kind === 'message') {
      setMessage({ text: r.output.message, classic: false })
      return
    }
    setResult(r.output)
    setSavedOnce(false)
    setFollowup('')
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function submit(e) {
    e.preventDefault()
    if (!canAsk || busy) return
    ask({ mode, text: text.trim(), hints })
  }

  function refine(e) {
    e.preventDefault()
    if (!followup.trim() || busy || !result) return
    ask({ mode: result.mode, followup: followup.trim(), previous: { criteria: result.criteria, picks: result.picks.map(p => p.slug) } })
  }

  function startOver() {
    setResult(null); setMessage(null); setText(''); setHints(EMPTY_HINTS); setFollowup(''); setSavedOnce(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveSearch() {
    if (!result?.picks?.length) return
    if (!user) {
      // The results are already in sessionStorage; sign-in brings them back here.
      navigate('/login?next=' + encodeURIComponent('/new-to-ny'))
      return
    }
    setSaving(true)
    const c = result.criteria || {}
    const beds = c.bedrooms === 'studio' ? '0' : c.bedrooms === '3+' ? '3' : c.bedrooms || ''
    const names = result.picks.map(p => p.name)
    const name = ('Guide: ' + names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2}` : '')).slice(0, 80)
    const { error } = await createSavedSearch(user.id, {
      name,
      filters: normalizeFilters({ listing_type: result.mode === 'buy' ? 'sale' : 'rent', price_max: c.budget_max ?? '', beds_min: beds }),
      neighborhoodIds: result.picks.map(p => p.id),
    })
    setSaving(false)
    if (error) {
      console.error('Save search failed:', error)
      toast.error(/20/.test(error.message || '') ? 'You already have 20 saved searches. Remove one in Profile first.' : 'Could not save the search')
      return
    }
    setSavedOnce(true)
    toast.success("Saved. You'll get a notification when a matching listing is posted.")
  }

  const chips = criteriaChips(result)
  const seg = (on) => ({
    flex: 1, padding: '10px 0', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
    background: on ? 'var(--terracotta)' : 'transparent', color: on ? 'white' : 'var(--warm-gray)',
  })

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #F5F0E8 0%, #EDE6D6 100%)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', gap: '12px' }}>
        <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 600, color: 'var(--terracotta)' }}>cuna</Link>
        <Link to={CLASSIC} style={{ fontSize: '13px', color: 'var(--warm-gray)', textDecoration: 'underline' }}>Step-by-step quiz</Link>
      </header>

      <main style={{ maxWidth: '560px', margin: '0 auto', padding: '8px 24px 48px' }}>
        <h1 style={{ fontSize: '34px', lineHeight: 1.1, marginBottom: '8px' }}>Find your neighborhood</h1>
        <p style={{ fontSize: '15px', color: 'var(--charcoal-soft)', lineHeight: 1.5, marginBottom: '20px' }}>
          Say what you are looking for in your own words: price, size, where you need to get to, what you want nearby.
        </p>

        <form onSubmit={submit} style={card}>
          <div role="group" aria-label="Rent or buy" style={{ display: 'flex', background: 'var(--sand)', borderRadius: '999px', padding: '4px', marginBottom: '16px' }}>
            <button type="button" onClick={() => setMode('rent')} aria-pressed={mode === 'rent'} style={seg(mode === 'rent')}>Rent</button>
            <button type="button" onClick={() => setMode('buy')} aria-pressed={mode === 'buy'} style={seg(mode === 'buy')}>Buy</button>
          </div>
          <label htmlFor="guide-text" style={{ ...label, marginTop: 0 }}>What are you looking for?</label>
          <textarea
            id="guide-text" value={text} onChange={e => setText(e.target.value)} rows={4} maxLength={800}
            placeholder={mode === 'buy'
              ? 'For example: a two-bedroom co-op under $900,000, close to the subway, with a park nearby'
              : 'For example: a one-bedroom under $3,200, near a park, and I need to get to Midtown'}
            style={{ ...input, resize: 'vertical', lineHeight: 1.5 }}
          />
          <button type="button" onClick={() => setDetailsOpen(o => !o)} aria-expanded={detailsOpen} style={{
            display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--terracotta)', fontSize: '13px', fontWeight: 600, padding: '12px 0 0',
          }}>
            {detailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />} Add details (optional)
          </button>
          {detailsOpen && (
            <div>
              <label htmlFor="guide-budget" style={label}>{mode === 'buy' ? 'Most you would pay' : 'Most you would pay a month'}</label>
              <input id="guide-budget" inputMode="numeric" value={hints.budget} placeholder={mode === 'buy' ? '900000' : '3200'}
                onChange={e => setHints(h => ({ ...h, budget: e.target.value.replace(/[^\d]/g, '').slice(0, 9) }))} style={input} />
              <span style={label}>Bedrooms</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {BEDROOMS.map(([v, l]) => (
                  <button key={v} type="button" aria-pressed={hints.bedrooms === v}
                    onClick={() => setHints(h => ({ ...h, bedrooms: h.bedrooms === v ? '' : v }))}
                    style={{
                      padding: '8px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                      border: '1px solid ' + (hints.bedrooms === v ? 'var(--terracotta)' : 'var(--sand-dark)'),
                      background: hints.bedrooms === v ? 'var(--terracotta)' : 'var(--white)', color: hints.bedrooms === v ? 'white' : 'var(--charcoal)',
                    }}>{l}</button>
                ))}
              </div>
              <label htmlFor="guide-commute" style={label}>Where do you need to get to?</label>
              <input id="guide-commute" value={hints.commute} maxLength={120} placeholder="An address, a station or a landmark"
                onChange={e => setHints(h => ({ ...h, commute: e.target.value }))} style={input} />
              <label htmlFor="guide-must" style={label}>Must-haves</label>
              <input id="guide-must" value={hints.must_haves} maxLength={200} placeholder="Elevator, laundry, near a park"
                onChange={e => setHints(h => ({ ...h, must_haves: e.target.value }))} style={input} />
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={!canAsk || busy} style={{ width: '100%', marginTop: '18px' }}>
            {busy && !result ? 'Looking through neighborhoods…' : 'Show neighborhoods'}
          </button>
          <AiLabel style={{ marginTop: '14px' }} />
        </form>

        {message && (
          <div role="status" style={{ ...card, marginTop: '16px', fontSize: '14px', lineHeight: 1.5 }}>
            {message.text}
            {message.classic && (
              <div style={{ marginTop: '10px' }}>
                <Link to={CLASSIC} style={{ color: 'var(--terracotta)', fontWeight: 600 }}>Use the step-by-step quiz instead</Link>
              </div>
            )}
          </div>
        )}

        {busy && result && (
          <div className="center" style={{ padding: '24px' }}><div className="spinner" /></div>
        )}

        {result?.kind === 'picks' && (
          <section ref={resultsRef} aria-live="polite" style={{ marginTop: '28px', scrollMarginTop: '16px' }}>
            <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>
              {result.picks.length} neighborhood{result.picks.length === 1 ? '' : 's'} to look at
            </h2>
            {result.note && (
              <p style={{ ...card, padding: '12px 16px', fontSize: '13px', lineHeight: 1.5, marginBottom: '12px' }}>{result.note}</p>
            )}
            <p style={{ fontSize: '15px', lineHeight: 1.5, color: 'var(--charcoal-soft)', marginBottom: '12px' }}>{result.intro}</p>
            {chips.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--warm-gray)', marginBottom: '6px' }}>What I used</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {chips.map(ch => (
                    <span key={ch} style={{ padding: '5px 10px', borderRadius: '999px', background: 'var(--white)', border: '1px solid var(--sand-dark)', fontSize: '12px' }}>{ch}</span>
                  ))}
                </div>
                {result.destination?.not_found && (
                  <p style={{ fontSize: '12px', color: 'var(--warm-gray)', marginTop: '8px' }}>
                    I could not find the place you need to get to on the map, so distances are not shown. Try a street address.
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {result.picks.map(p => (
                <article key={p.slug} style={card}>
                  <h3 style={{ fontSize: '24px', lineHeight: 1.15 }}>{p.name}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--warm-gray)', marginBottom: '10px' }}>{p.borough}</div>
                  {p.lines.length > 0 ? (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }} aria-label="Subway lines">
                      {p.lines.map(l => <Bullet key={l} route={l} />)}
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--warm-gray)', marginBottom: '12px' }}>No subway station inside this neighborhood.</div>
                  )}
                  <ul style={{ margin: '0 0 12px', paddingLeft: '18px', fontSize: '14px', lineHeight: 1.5 }}>
                    {p.reasons.map((r, i) => <li key={i} style={{ marginBottom: '4px' }}>{r}</li>)}
                  </ul>
                  {p.commute && result.destination?.label && (
                    <p style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '12px' }}>
                      About {p.commute.miles} miles in a straight line from {result.destination.label}
                      {p.commute.shared_lines.length > 0 ? `, and on the ${p.commute.shared_lines.join(', ')} with stations near it.` : '.'}
                      <span style={{ color: 'var(--warm-gray)' }}> Distance, not travel time.</span>
                    </p>
                  )}
                  {p.figures.length > 0 ? (
                    <div style={{ borderTop: '1px solid var(--sand-dark)', paddingTop: '10px', marginBottom: '12px' }}>
                      {p.figures.map(f => (
                        <div key={f.label} style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '14px' }}>
                            <span>{f.label}</span>
                            <span style={{ fontWeight: 600, textAlign: 'right' }}>{f.value}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--warm-gray)', lineHeight: 1.4 }}>
                            Source: {f.source}, {f.as_of}. Area: {f.boundary}.
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: 'var(--warm-gray)', borderTop: '1px solid var(--sand-dark)', paddingTop: '10px', marginBottom: '12px' }}>
                      Cuna does not hold a price figure for this neighborhood yet.
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" style={{ padding: '10px 16px', fontSize: '14px' }}
                      onClick={() => navigate(`/feed?hood=${encodeURIComponent(p.id)}&type=${result.mode === 'buy' ? 'sale' : 'rent'}`)}>
                      See listings{p.listings_count > 0 ? ` (${p.listings_count})` : ''}
                    </button>
                    <Link to={`/neighborhoods/${p.slug}`} className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '14px' }}>
                      About {p.name}
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {result.missing && (
              <p style={{ fontSize: '13px', lineHeight: 1.5, marginTop: '16px' }}>{result.missing}</p>
            )}
            <p style={{ fontSize: '11px', color: 'var(--warm-gray)', lineHeight: 1.5, marginTop: '12px' }}>
              {result.boundary_note} Cuna data as of {result.data_as_of}.
            </p>

            <form onSubmit={refine} style={{ ...card, marginTop: '20px' }}>
              <label htmlFor="guide-followup" style={{ ...label, marginTop: 0 }}>Change something</label>
              <input id="guide-followup" value={followup} maxLength={400} onChange={e => setFollowup(e.target.value)}
                placeholder="For example: cheaper, or closer to Midtown" style={input} />
              <button type="submit" className="btn btn-secondary" disabled={!followup.trim() || busy} style={{ width: '100%', marginTop: '12px' }}>
                {busy ? 'Updating…' : 'Update the list'}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-primary" onClick={saveSearch} disabled={saving || savedOnce} style={{ width: '100%' }}>
                {savedOnce ? 'Search saved' : saving ? 'Saving…' : user ? 'Save this search' : 'Sign in to save this search'}
              </button>
              <button onClick={startOver} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', fontSize: '13px', textDecoration: 'underline', padding: '8px' }}>
                Start over
              </button>
            </div>
            <AiLabel style={{ marginTop: '12px' }} />
          </section>
        )}

        <div style={{ marginTop: '28px' }}><FairHousingNotice compact /></div>
      </main>
    </div>
  )
}
