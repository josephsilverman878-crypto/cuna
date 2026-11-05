import { useEffect, useMemo, useState } from 'react'
import { X, Search } from 'lucide-react'
import {
  SORTS, AMENITY_OPTIONS, PETS_OPTIONS, BEDS_OPTIONS, BATHS_OPTIONS, PRICE_BASIS_OPTIONS, EMPTY_FILTERS, normalizeFilters,
} from '../lib/search'
import { groupByBorough } from '../lib/areas'
import { LISTING_TYPES } from '../lib/listingTypes'

// Bottom-sheet filter panel for the feed. Edits a draft and hands the whole
// set back on Apply, so a half-typed price never fires a search.
//
// props: open, onClose, filters, sort, neighborhoods (list), selectedIds (Set),
//        onApply({ filters, sort, neighborhoodIds })

function Chip({ active, children, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      style={{
        padding: '8px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: active ? 600 : 500,
        border: `1.5px solid ${active ? 'var(--terracotta)' : 'var(--warm-gray-light)'}`,
        background: active ? 'rgba(196,113,74,0.1)' : 'var(--white)',
        color: active ? 'var(--terracotta)' : 'var(--charcoal-soft)', cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--sand-dark)' }}>
      <div className="label" style={{ marginBottom: '10px' }}>{title}</div>
      {children}
    </div>
  )
}

export default function FilterSheet({ open, onClose, filters, sort, neighborhoods, selectedIds, onApply }) {
  const [draft, setDraft] = useState(() => normalizeFilters(filters))
  const [draftSort, setDraftSort] = useState(sort)
  const [draftIds, setDraftIds] = useState(() => new Set(selectedIds || []))
  const [hoodQuery, setHoodQuery] = useState('')

  useEffect(() => {
    if (!open) return
    setDraft(normalizeFilters(filters))
    setDraftSort(sort)
    setDraftIds(new Set(selectedIds || []))
    setHoodQuery('')
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  const grouped = useMemo(() => {
    const q = hoodQuery.trim().toLowerCase()
    const list = q ? (neighborhoods || []).filter(n => n.name.toLowerCase().includes(q)) : (neighborhoods || [])
    return groupByBorough(list)
  }, [neighborhoods, hoodQuery])

  const byId = useMemo(() => new Map((neighborhoods || []).map(n => [n.id, n])), [neighborhoods])

  if (!open) return null

  function set(k, v) { setDraft(d => ({ ...d, [k]: v })) }
  function toggleIn(k, v) {
    setDraft(d => {
      const list = d[k].includes(v) ? d[k].filter(x => x !== v) : [...d[k], v]
      return { ...d, [k]: list }
    })
  }
  function toggleHood(id) {
    setDraftIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function reset() {
    setDraft({ ...EMPTY_FILTERS })
    setDraftIds(new Set())
    setDraftSort('newest')
  }
  function apply() {
    onApply({ filters: normalizeFilters(draft), sort: draftSort, neighborhoodIds: [...draftIds] })
    onClose()
  }

  const inputStyle = { padding: '10px 12px', fontSize: '15px' }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(44,36,32,0.45)', zIndex: 200 }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 201,
          background: 'var(--white)', borderRadius: '20px 20px 0 0',
          maxHeight: '88dvh', display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)', maxWidth: '600px', margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px', borderBottom: '1px solid var(--sand-dark)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', margin: 0 }}>Filters</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button type="button" onClick={reset} className="btn-ghost" style={{ padding: '6px 10px', fontSize: '13px' }}>Reset</button>
            <button type="button" onClick={onClose} aria-label="Close filters" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', padding: '0 20px', flex: 1 }}>
          <Section title="Looking to">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {LISTING_TYPES.map(t => (
                <Chip key={t.id} active={draft.listing_type === t.id} onClick={() => set('listing_type', t.id)}>{t.label}</Chip>
              ))}
            </div>
          </Section>

          <Section title="Sort by">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SORTS.filter(s => draft.listing_type !== 'sale' || s.id !== 'net_asc').map(s => (
                <Chip key={s.id} active={draftSort === s.id} onClick={() => setDraftSort(s.id)}>{s.label}</Chip>
              ))}
            </div>
          </Section>

          <Section title={draft.listing_type === 'sale' ? 'Price' : 'Monthly rent'}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center' }}>
              <input type="number" inputMode="numeric" min="0" placeholder="Min $" aria-label="Minimum price" value={draft.price_min}
                onChange={e => set('price_min', e.target.value)} style={inputStyle} />
              <span style={{ color: 'var(--warm-gray)' }}>to</span>
              <input type="number" inputMode="numeric" min="0" placeholder="Max $" aria-label="Maximum price" value={draft.price_max}
                onChange={e => set('price_max', e.target.value)} style={inputStyle} />
            </div>
            {draft.listing_type !== 'sale' && (
              <>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {PRICE_BASIS_OPTIONS.map(o => (
                    <Chip key={o.value} active={draft.price_basis === o.value} onClick={() => set('price_basis', o.value)}>{o.label}</Chip>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: '6px 0 0', lineHeight: 1.5 }}>
                  Net effective spreads any free months over the lease. Cards show both when they differ.
                </p>
              </>
            )}
          </Section>

          <Section title="Bedrooms">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {BEDS_OPTIONS.map(o => (
                <Chip key={o.value || 'any'} active={draft.beds_min === o.value} onClick={() => set('beds_min', o.value)}>{o.label}</Chip>
              ))}
            </div>
          </Section>

          <Section title="Bathrooms">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {BATHS_OPTIONS.map(o => (
                <Chip key={o.value || 'any'} active={draft.baths_min === o.value} onClick={() => set('baths_min', o.value)}>{o.label}</Chip>
              ))}
            </div>
          </Section>

          <Section title="Minimum size">
            <input type="number" inputMode="numeric" min="0" placeholder="Min sq ft" aria-label="Minimum square feet" value={draft.sqft_min}
              onChange={e => set('sqft_min', e.target.value)} style={inputStyle} />
            <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: '6px 0 0' }}>Listings without a size still show.</p>
          </Section>

          <Section title="Pets">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PETS_OPTIONS.map(o => (
                <Chip key={o.value} active={draft.pets.includes(o.value)} onClick={() => toggleIn('pets', o.value)}>{o.label}</Chip>
              ))}
            </div>
          </Section>

          <Section title="Amenities">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {AMENITY_OPTIONS.map(a => (
                <Chip key={a} active={draft.amenities.includes(a)} onClick={() => toggleIn('amenities', a)}>{a}</Chip>
              ))}
            </div>
          </Section>

          <Section title={`Neighborhoods${draftIds.size ? ` (${draftIds.size})` : ''}`}>
            {draftIds.size > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {[...draftIds].map(id => byId.get(id)).filter(Boolean).map(n => (
                  <button key={n.id} type="button" onClick={() => toggleHood(n.id)} className="tag"
                    style={{ cursor: 'pointer', background: 'rgba(196,113,74,0.12)', color: 'var(--terracotta)' }} aria-label={`Remove ${n.name}`}>
                    {n.name} <X size={12} />
                  </button>
                ))}
              </div>
            )}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--warm-gray)' }} />
              <input placeholder="Search neighborhoods" aria-label="Search neighborhoods" value={hoodQuery}
                onChange={e => setHoodQuery(e.target.value)} style={{ ...inputStyle, paddingLeft: '36px' }} />
            </div>
            <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid var(--sand-dark)', borderRadius: '10px', padding: '4px 0' }}>
              {grouped.length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--warm-gray)', padding: '10px 12px', margin: 0 }}>No neighborhood matches.</p>
              )}
              {grouped.map(([borough, items]) => (
                <div key={borough}>
                  <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--warm-gray)', padding: '8px 12px 4px' }}>{borough}</div>
                  {items.map(n => {
                    const on = draftIds.has(n.id)
                    return (
                      <label key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '14px', color: on ? 'var(--terracotta)' : 'var(--charcoal)' }}>
                        <input type="checkbox" checked={on} onChange={() => toggleHood(n.id)} style={{ width: '16px', height: '16px', accentColor: 'var(--terracotta)' }} />
                        {n.name}
                      </label>
                    )
                  })}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: '8px 0 0' }}>You can also tap neighborhoods on the map.</p>
          </Section>
          <div style={{ height: '12px' }} />
        </div>

        <div style={{ padding: '12px 20px max(16px, env(safe-area-inset-bottom))', borderTop: '1px solid var(--sand-dark)', display: 'flex', gap: '10px' }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
          <button type="button" onClick={apply} className="btn-primary" style={{ flex: 2, padding: '12px' }}>Show listings</button>
        </div>
      </div>
    </>
  )
}
