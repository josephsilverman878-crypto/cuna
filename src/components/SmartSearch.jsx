import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { aiFeature, aiRequest } from '../lib/ai'
import { EMPTY_FILTERS, normalizeFilters, SORTS, PETS_OPTIONS } from '../lib/search'
import AiLabel from './AiLabel'

// Plain-English search box at the top of the feed (AI phase 4). The
// assistant only translates the sentence into the feed's existing filters;
// the listings themselves come from the normal search. What it understood
// is shown as chips the person can remove before anything is applied, and
// only what they asked for is ever set.

function money(v) {
  return '$' + Number(v).toLocaleString('en-US')
}

// One removable chip per thing that was understood.
function chipsOf(p) {
  const f = p.filters || {}
  const chips = []
  if (f.listing_type) chips.push({ key: 'listing_type', label: f.listing_type === 'sale' ? 'For sale' : 'For rent' })
  if (f.price_min && f.price_max) chips.push({ key: 'price', label: `${money(f.price_min)} to ${money(f.price_max)}` })
  else if (f.price_max) chips.push({ key: 'price', label: `Up to ${money(f.price_max)}` })
  else if (f.price_min) chips.push({ key: 'price', label: `From ${money(f.price_min)}` })
  if (f.beds_min !== undefined) chips.push({ key: 'beds_min', label: f.beds_min === '0' ? 'Studio or larger' : `${f.beds_min}+ bedrooms` })
  if (f.baths_min) chips.push({ key: 'baths_min', label: `${f.baths_min}+ baths` })
  if (f.sqft_min) chips.push({ key: 'sqft_min', label: `${Number(f.sqft_min).toLocaleString('en-US')}+ sq ft` })
  for (const a of f.amenities || []) chips.push({ key: 'amenity:' + a, label: a })
  for (const v of f.pets || []) chips.push({ key: 'pets:' + v, label: PETS_OPTIONS.find(o => o.value === v)?.label || v })
  for (const n of p.neighborhoods || []) chips.push({ key: 'hood:' + n.id, label: n.name })
  if (p.sort) chips.push({ key: 'sort', label: SORTS.find(s => s.id === p.sort)?.label || p.sort })
  return chips
}

function without(p, key) {
  const next = { ...p, filters: { ...p.filters } }
  if (key === 'price') { delete next.filters.price_min; delete next.filters.price_max }
  else if (key === 'sort') next.sort = null
  else if (key.startsWith('amenity:')) next.filters.amenities = (p.filters.amenities || []).filter(a => a !== key.slice(8))
  else if (key.startsWith('pets:')) next.filters.pets = (p.filters.pets || []).filter(v => v !== key.slice(5))
  else if (key.startsWith('hood:')) next.neighborhoods = (p.neighborhoods || []).filter(n => n.id !== key.slice(5))
  else delete next.filters[key]
  return next
}

export default function SmartSearch({ currentType, currentSort, onApply }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [parsed, setParsed] = useState(null)
  const [message, setMessage] = useState(null)
  if (!aiFeature('search')) return null

  async function submit(e) {
    e.preventDefault()
    if (!text.trim() || busy) return
    setBusy(true); setMessage(null); setParsed(null)
    const r = await aiRequest('search_parse', { text: text.trim() })
    setBusy(false)
    if (!r.ok) { setMessage(r.message); return }
    if (r.output?.kind === 'message') { setMessage(r.output.message); return }
    setParsed(r.output)
  }

  function apply() {
    const f = parsed.filters || {}
    onApply({
      // Start from empty filters: nothing the person did not ask for is kept or added.
      filters: normalizeFilters({ ...EMPTY_FILTERS, listing_type: f.listing_type || currentType, ...f }),
      neighborhoodIds: (parsed.neighborhoods || []).map(n => n.id),
      area: null,
      sort: parsed.sort || currentSort,
    })
    setParsed(null); setText('')
  }

  const chips = parsed ? chipsOf(parsed) : []
  const missed = parsed ? [...(parsed.unmatched_neighborhoods || []).map(n => `"${n}" (not a Cuna neighborhood name)`), ...(parsed.unsupported || [])] : []
  return (
    <div style={{ marginBottom: '14px' }}>
      <form onSubmit={submit} style={{ display: 'flex', gap: '8px' }}>
        <input value={text} onChange={e => setText(e.target.value)} maxLength={300} aria-label="Describe what you are looking for"
          placeholder="Try: 2 bed under $4,000 in Astoria, dishwasher"
          style={{ flex: 1, minWidth: 0, padding: '11px 14px', borderRadius: '999px', border: '1px solid var(--sand-dark)', background: 'var(--white)', fontSize: '14px', fontFamily: 'var(--font-body)' }} />
        <button type="submit" disabled={!text.trim() || busy} aria-label="Search" className="btn btn-primary"
          style={{ padding: '0 16px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
          <Search size={15} aria-hidden="true" /> {busy ? '…' : 'Search'}
        </button>
      </form>
      {message && <p role="status" style={{ fontSize: '13px', lineHeight: 1.5, margin: '10px 4px 0' }}>{message}</p>}
      {parsed && (
        <div style={{ marginTop: '10px', background: 'var(--white)', borderRadius: 'var(--radius-sm)', padding: '14px', boxShadow: 'var(--shadow-sm)' }}>
          {parsed.note && <p style={{ fontSize: '13px', lineHeight: 1.5, margin: '0 0 10px' }}>{parsed.note}</p>}
          {chips.length > 0 ? (
            <>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--warm-gray)', marginBottom: '8px' }}>Filters from what you typed. Remove any you do not want.</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {chips.map(c => (
                  <button key={c.key} type="button" onClick={() => setParsed(p => without(p, c.key))} aria-label={`Remove ${c.label}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '999px', border: '1px solid var(--terracotta)', background: 'rgba(196,113,74,0.08)', color: 'var(--charcoal)', fontSize: '13px', cursor: 'pointer' }}>
                    {c.label} <X size={12} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p style={{ fontSize: '13px', lineHeight: 1.5, margin: 0 }}>I could not turn that into a filter. Try a price, a number of bedrooms, a neighborhood or an amenity.</p>
          )}
          {missed.length > 0 && (
            <p style={{ fontSize: '12px', color: 'var(--warm-gray)', lineHeight: 1.5, margin: '10px 0 0' }}>
              Not searchable here, so not applied: {missed.join('; ')}.
            </p>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            {chips.length > 0 && <button type="button" className="btn btn-primary" style={{ padding: '9px 16px', fontSize: '13px' }} onClick={apply}>Show listings</button>}
            <button type="button" className="btn btn-secondary" style={{ padding: '9px 16px', fontSize: '13px' }} onClick={() => setParsed(null)}>Cancel</button>
          </div>
          <AiLabel style={{ marginTop: '10px' }} />
        </div>
      )}
    </div>
  )
}
