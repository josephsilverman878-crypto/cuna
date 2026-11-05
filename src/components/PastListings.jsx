import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { History } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { priceText } from '../lib/listingTypes'
import { statusLabel, formatShortDate } from '../lib/listingStatus'

// Sold and Rented Cuna listings at the same building (same BBL, or the same
// address when there is no BBL), through the past_listings_at function,
// which returns public fields only.
export default function PastListings({ bbl, address, excludeId }) {
  const navigate = useNavigate()
  const [rows, setRows] = useState(null)

  useEffect(() => {
    if (!bbl && !address) return
    let cancelled = false
    supabase.rpc('past_listings_at', { p_bbl: bbl || null, p_address: bbl ? null : address, p_exclude: excludeId || null })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Past listings failed:', error)
        setRows(data || [])
      })
    return () => { cancelled = true }
  }, [bbl, address, excludeId])

  if (!rows || rows.length === 0) return null

  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <History size={15} color="var(--terracotta)" /> Past listings on Cuna
      </p>
      <div style={{ border: '1px solid var(--sand-dark)', borderRadius: '10px', overflow: 'hidden' }}>
        {rows.map((r, i) => (
          <button key={r.id} type="button" onClick={() => navigate('/listing/' + r.id)} style={{
            display: 'flex', justifyContent: 'space-between', gap: '10px', width: '100%', textAlign: 'left',
            padding: '9px 12px', fontSize: '13px', background: 'var(--white)', border: 'none', cursor: 'pointer',
            borderTop: i ? '1px solid var(--sand-dark)' : 'none', color: 'var(--charcoal)',
          }}>
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.address} · {r.bedrooms} bed
            </span>
            <span style={{ flexShrink: 0, color: 'var(--charcoal-soft)' }}>
              <strong style={{ color: 'var(--charcoal)' }}>{priceText(r)}</strong> · {statusLabel(r.status)} {formatShortDate(r.status_changed_at)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
