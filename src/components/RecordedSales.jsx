import { useEffect, useState } from 'react'
import { Landmark } from 'lucide-react'
import { money } from '../lib/listingTypes'

// Recorded sales for the building's tax lot, from NYC public records only
// (DOF Rolling Sales + ACRIS, through /api/recorded-sales). Shown on sale
// listing pages that carry a BBL. Co-op sales usually do not appear in
// these records; the note below says so instead of pretending.
export default function RecordedSales({ bbl, propertyType }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!bbl) return
    let cancelled = false
    fetch(`/api/recorded-sales?bbl=${encodeURIComponent(bbl)}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then(d => { if (!cancelled) setData(d) })
      .catch(err => { console.error('Recorded sales failed:', err); if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [bbl])

  if (!bbl) return null

  // One list: DOF rows first (they carry the unit), then ACRIS deeds not
  // already covered by a DOF row on the same date and price.
  const rows = []
  if (data) {
    const seen = new Set()
    for (const s of data.dof || []) { rows.push(s); seen.add(`${s.date}|${s.price}`) }
    for (const s of data.acris || []) { if (!seen.has(`${s.date}|${s.price}`)) rows.push(s) }
    rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }
  const asOf = data ? [data.dof_as_of, data.acris_as_of].filter(Boolean).sort().pop() : null

  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Landmark size={15} color="var(--terracotta)" /> Recorded sales in this building
      </p>
      {error ? (
        <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>Public records could not be loaded right now.</p>
      ) : !data ? (
        <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>Checking NYC records…</p>
      ) : rows.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0, lineHeight: 1.5 }}>
          No recorded sales found for this lot in the city's records.
        </p>
      ) : (
        <div style={{ border: '1px solid var(--sand-dark)', borderRadius: '10px', overflow: 'hidden' }}>
          {rows.slice(0, 12).map((s, i) => (
            <div key={`${s.source}-${s.date}-${s.price}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '9px 12px', fontSize: '13px', borderTop: i ? '1px solid var(--sand-dark)' : 'none' }}>
              <span style={{ color: 'var(--charcoal-soft)' }}>
                {s.date ? new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                {s.unit ? <span style={{ color: 'var(--warm-gray)' }}> · unit {s.unit}</span> : null}
              </span>
              <span style={{ fontWeight: 600, flexShrink: 0 }}>{money(s.price)}</span>
            </div>
          ))}
          {rows.length > 12 && (
            <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--warm-gray)', borderTop: '1px solid var(--sand-dark)' }}>
              Showing the 12 most recent of {rows.length}.
            </div>
          )}
        </div>
      )}
      <p style={{ fontSize: '11px', color: 'var(--warm-gray)', margin: '8px 0 0', lineHeight: 1.5 }}>
        Source: NYC Department of Finance (Rolling Sales and ACRIS), via NYC Open Data{asOf ? `, as of ${new Date(asOf + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}` : ''}.
        Whole-building transfers appear alongside unit sales.
        {propertyType === 'coop' ? ' Co-op sales are share transfers and often are not in these records, so a short or empty list here is normal for a co-op.' : ''}
      </p>
    </div>
  )
}
