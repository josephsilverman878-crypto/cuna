import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AI_ACTIONS_ENABLED } from '../lib/ai'
import { listAiActions } from '../lib/aiActions'

// Profile → "What the assistant did for you" (AI phase 5, item 5.3). Every
// action the assistant carried out after a confirmation, newest first.
const KIND = { save_listing: 'Saved a listing', save_search: 'Saved a search', tour_request: 'Sent a tour request' }

export default function AssistantActivity() {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    if (!AI_ACTIONS_ENABLED) return
    let cancelled = false
    listAiActions().then(({ data, error }) => { if (!cancelled) setRows(error ? [] : data || []) })
    return () => { cancelled = true }
  }, [])
  if (!AI_ACTIONS_ENABLED || rows === null) return null
  return (
    <div className="card">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '6px' }}>What the assistant did for you</h3>
      <p style={{ fontSize: '12px', color: 'var(--warm-gray)', lineHeight: 1.5, margin: '0 0 10px' }}>
        Cuna's assistant only acts when you tap Confirm. Each time it does, it is listed here.
      </p>
      {rows.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>Nothing yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map(r => (
            <li key={r.id} style={{ padding: '10px 0', borderTop: '1px solid var(--sand-dark)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{KIND[r.kind] || r.kind}</div>
              <div style={{ fontSize: '13px', lineHeight: 1.5 }}>{r.summary}</div>
              <div style={{ fontSize: '11px', color: 'var(--warm-gray)' }}>
                {new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })}
                {r.listing_id && <> · <Link to={`/listing/${r.listing_id}`} style={{ color: 'var(--terracotta)' }}>View listing</Link></>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
