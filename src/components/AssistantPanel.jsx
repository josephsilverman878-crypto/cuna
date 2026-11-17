import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Sparkles, ThumbsUp, ThumbsDown, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { aiFeature, aiRequest, AI_ACTIONS_ENABLED } from '../lib/ai'
import { attachPosterContacts } from '../lib/posterContacts'
import { setLiked } from '../lib/swipes'
import { createSavedSearch } from '../lib/savedSearches'
import { EMPTY_FILTERS, normalizeFilters, describeFilters } from '../lib/search'
import { priceText } from '../lib/listingTypes'
import { logAiAction } from '../lib/aiActions'
import AiLabel from './AiLabel'

// The assistant panel in the feed (AI phase 5).
//
// 5.1 It suggests real, active Cuna listings for what the person typed and
//     says why each fits. Thumbs up / down are remembered for this visit
//     only and sent with the next request.
// 5.2 It can save a listing, save the search, or start a tour request, but
//     only from a button, and only after a confirmation card that says
//     exactly what will happen and what is shared. Nothing typed into the
//     box can trigger an action: the server that reads the text cannot act.
//     A tour request opens the normal Request a tour form, which is its own
//     confirmation (dates, what you share, your message, Send).
// Every confirmed action is written to the person's activity log.

const card = { background: 'var(--white)', borderRadius: 'var(--radius-sm)', padding: '14px', boxShadow: 'var(--shadow-sm)' }
const small = { padding: '8px 12px', fontSize: '13px' }

export default function AssistantPanel({ user, onRequestTour, onSavedListing }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState(null)        // { intro, items: [{ listing, reasons }], criteria, actions, kind, message }
  const [liked, setLikedIds] = useState([])   // this visit only
  const [disliked, setDislikedIds] = useState([])
  const [confirm, setConfirm] = useState(null) // { type: 'save_listing', listing } | { type: 'save_search' }
  const [working, setWorking] = useState(false)
  const [done, setDone] = useState({})        // { [listingId or 'search']: true }
  if (!aiFeature('recommend')) return null

  const canAct = AI_ACTIONS_ENABLED && res?.actions === true

  async function ask(e) {
    e?.preventDefault()
    if (text.trim().length < 2 || busy) return
    setBusy(true); setConfirm(null)
    const r = await aiRequest('recommend', { text: text.trim(), liked, disliked })
    if (!r.ok) { setBusy(false); setRes({ kind: 'message', message: r.message }); return }
    const out = r.output
    let items = []
    if (out.kind === 'listings' && out.items.length) {
      // The cards are built from Cuna's own rows, read with this person's
      // session; the assistant only supplied the ids and the reasons.
      const { data } = await supabase.from('listings').select('*').in('id', out.items.map(i => i.id)).eq('status', 'active')
      const rows = await attachPosterContacts(data || [])
      items = out.items.map(i => ({ listing: rows.find(l => l.id === i.id), reasons: i.reasons })).filter(i => i.listing)
    }
    setBusy(false)
    setRes({ ...out, items })
  }

  // Functional updates, so two quick taps cannot overwrite each other.
  function thumb(id, up) {
    setLikedIds(prev => (up ? (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) : prev.filter(x => x !== id)))
    setDislikedIds(prev => (!up ? (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) : prev.filter(x => x !== id)))
  }

  const criteriaSummary = res?.criteria
    ? describeFilters(normalizeFilters({ ...EMPTY_FILTERS, ...res.criteria.filters }), (res.criteria.neighborhoods || []).map(n => n.name), false)
    : ''

  async function confirmAction() {
    if (!confirm || working) return
    setWorking(true)
    if (confirm.type === 'save_listing') {
      const l = confirm.listing
      // Only `liked` is written; a hide on the same listing is left alone.
      const { error } = await setLiked(user.id, l.id, true)
      setWorking(false)
      if (error) { console.error('Assistant save failed:', error); toast.error('Could not save that listing'); return }
      await logAiAction({ kind: 'save_listing', listingId: l.id, summary: `Saved ${l.address} to your saved listings.` })
      onSavedListing?.(l.id)
      setDone(d => ({ ...d, [l.id]: true })); setConfirm(null)
      toast.success('Saved to your listings')
    } else if (confirm.type === 'save_search') {
      const c = res.criteria
      const name = (criteriaSummary || 'Assistant search').slice(0, 80)
      const { data, error } = await createSavedSearch(user.id, {
        name, filters: normalizeFilters({ ...EMPTY_FILTERS, ...c.filters }), neighborhoodIds: (c.neighborhoods || []).map(n => n.id),
      })
      setWorking(false)
      if (error) { console.error('Assistant save search failed:', error); toast.error(/20/.test(error.message || '') ? 'You already have 20 saved searches. Remove one in Profile first.' : 'Could not save the search'); return }
      await logAiAction({ kind: 'save_search', savedSearchId: data?.id || null, summary: `Saved the search "${name}".` })
      setDone(d => ({ ...d, search: true })); setConfirm(null)
      toast.success('Search saved')
    }
  }

  return (
    <div style={{ marginBottom: '14px' }}>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="btn btn-secondary"
          style={{ width: '100%', padding: '10px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Sparkles size={14} aria-hidden="true" /> Ask Cuna's assistant for suggestions
        </button>
      ) : (
        <section style={card} aria-label="Cuna's assistant">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0 }}>Suggestions from Cuna's assistant</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close the assistant" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex' }}><X size={18} /></button>
          </div>
          <form onSubmit={ask} style={{ display: 'flex', gap: '8px' }}>
            <input value={text} onChange={e => setText(e.target.value)} maxLength={400} aria-label="What are you looking for?"
              placeholder="2 bed under $4,000 in Astoria, dishwasher"
              style={{ flex: 1, minWidth: 0, padding: '11px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--sand-dark)', fontSize: '14px', fontFamily: 'var(--font-body)' }} />
            <button type="submit" className="btn btn-primary" disabled={text.trim().length < 2 || busy} style={{ padding: '0 16px', fontSize: '14px' }}>{busy ? '…' : 'Suggest'}</button>
          </form>

          {res && (res.kind === 'message' || res.kind === 'none') && (
            <p role="status" style={{ fontSize: '14px', lineHeight: 1.5, margin: '12px 0 0' }}>{res.message}</p>
          )}
          {res?.criteria?.note && <p style={{ fontSize: '13px', lineHeight: 1.5, margin: '10px 0 0' }}>{res.criteria.note}</p>}
          {res?.kind === 'listings' && (
            <>
              <p style={{ fontSize: '14px', lineHeight: 1.5, margin: '12px 0' }}>{res.intro}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {res.items.map(({ listing: l, reasons }) => (
                  <article key={l.id} style={{ border: '1px solid var(--sand-dark)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    {l.photos?.[0] && <img src={l.photos[0]} alt="" loading="lazy" style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />}
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600 }}>{priceText(l)}</div>
                      <div style={{ fontSize: '13px', color: 'var(--charcoal-soft)' }}>
                        {l.bedrooms === 0 ? 'Studio' : `${l.bedrooms} bed`} · {l.bathrooms} bath{l.sqft ? ` · ${l.sqft} sq ft` : ''}{l.neighborhood ? ` · ${l.neighborhood}` : ''}
                      </div>
                      <ul style={{ margin: '8px 0', paddingLeft: '18px', fontSize: '13px', lineHeight: 1.5 }}>
                        {reasons.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button type="button" onClick={() => thumb(l.id, true)} aria-pressed={liked.includes(l.id)} aria-label="More like this"
                          style={{ ...small, borderRadius: '999px', border: '1px solid var(--sand-dark)', background: liked.includes(l.id) ? 'var(--terracotta)' : 'var(--white)', color: liked.includes(l.id) ? 'white' : 'var(--charcoal)', cursor: 'pointer', display: 'inline-flex' }}><ThumbsUp size={14} /></button>
                        <button type="button" onClick={() => thumb(l.id, false)} aria-pressed={disliked.includes(l.id)} aria-label="Less like this"
                          style={{ ...small, borderRadius: '999px', border: '1px solid var(--sand-dark)', background: disliked.includes(l.id) ? 'var(--charcoal)' : 'var(--white)', color: disliked.includes(l.id) ? 'white' : 'var(--charcoal)', cursor: 'pointer', display: 'inline-flex' }}><ThumbsDown size={14} /></button>
                        <Link to={`/listing/${l.id}`} className="btn btn-secondary" style={small}>View</Link>
                        {canAct && (
                          <>
                            <button type="button" className="btn btn-secondary" style={small} disabled={done[l.id]} onClick={() => setConfirm({ type: 'save_listing', listing: l })}>{done[l.id] ? 'Saved' : 'Save'}</button>
                            <button type="button" className="btn btn-secondary" style={small} onClick={() => { setConfirm(null); onRequestTour?.(l) }}>Request a tour</button>
                          </>
                        )}
                      </div>
                      {confirm?.type === 'save_listing' && confirm.listing.id === l.id && (
                        <div role="alertdialog" aria-label="Confirm saving this listing" style={{ marginTop: '10px', background: 'var(--sand)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Save this listing?</div>
                          <p style={{ fontSize: '13px', lineHeight: 1.5, margin: '0 0 10px' }}>
                            <strong>What will happen:</strong> {l.address} is added to your saved listings.<br />
                            <strong>What is shared:</strong> nothing. Saves are private; the agent is not told.
                          </p>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" className="btn btn-primary" style={small} disabled={working} onClick={confirmAction}>{working ? 'Saving…' : 'Confirm: save listing'}</button>
                            <button type="button" className="btn btn-secondary" style={small} onClick={() => setConfirm(null)}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              {(liked.length > 0 || disliked.length > 0) && (
                <button type="button" className="btn btn-secondary" style={{ ...small, width: '100%', marginTop: '12px' }} disabled={busy} onClick={() => ask(null)}>
                  {busy ? 'Updating…' : 'Update suggestions with my thumbs'}
                </button>
              )}
            </>
          )}

          {canAct && res?.criteria && Object.keys(res.criteria.filters || {}).length + (res.criteria.neighborhoods || []).length > 0 && (
            <div style={{ marginTop: '12px' }}>
              {confirm?.type === 'save_search' ? (
                <div role="alertdialog" aria-label="Confirm saving this search" style={{ background: 'var(--sand)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Save this search?</div>
                  <p style={{ fontSize: '13px', lineHeight: 1.5, margin: '0 0 10px' }}>
                    <strong>What will happen:</strong> a saved search is added to your profile with these filters: {criteriaSummary || 'none'}. Cuna notifies you in the app when a matching listing is posted.<br />
                    <strong>What is shared:</strong> nothing. Agents do not see saved searches.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn btn-primary" style={small} disabled={working} onClick={confirmAction}>{working ? 'Saving…' : 'Confirm: save search'}</button>
                    <button type="button" className="btn btn-secondary" style={small} onClick={() => setConfirm(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn btn-secondary" style={{ ...small, width: '100%' }} disabled={done.search} onClick={() => setConfirm({ type: 'save_search' })}>
                  {done.search ? 'Search saved' : 'Save this search'}
                </button>
              )}
            </div>
          )}
          <p style={{ fontSize: '11px', color: 'var(--warm-gray)', lineHeight: 1.5, margin: '12px 0 0' }}>
            Suggestions are active listings on Cuna that match what you typed. Thumbs are used for this visit only.{canAct ? ' The assistant never saves or sends anything until you confirm.' : ''}
          </p>
          <AiLabel style={{ marginTop: '8px' }} />
        </section>
      )}
    </div>
  )
}
