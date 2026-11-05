import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminListFlags, adminResolveFlag, flagLabel } from '../lib/flags'

// /admin → Flags: listings the database flagged as suspicious (price far
// below the area, photos reused from another poster), open or resolved.
export default function AdminFlags() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const [rows, setRows] = useState(null)
  const [note, setNote] = useState({})
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    let cancelled = false
    setRows(null)
    adminListFlags(open).then(({ data, error }) => {
      if (cancelled) return
      if (error) { console.error('Flags failed:', error); toast.error('Could not load flags') }
      setRows(data || [])
    })
    return () => { cancelled = true }
  }, [open])

  async function resolve(f) {
    setBusy(f.id)
    const { data, error } = await adminResolveFlag(f.id, note[f.id])
    setBusy(null)
    if (error) { toast.error(error.message || 'Could not resolve'); return }
    if (!data) toast.error('Already resolved')
    setRows(prev => prev.filter(x => x.id !== f.id))
    toast.success('Resolved')
  }

  const pill = (on) => ({
    padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
    background: on ? 'var(--terracotta)' : 'var(--white)', color: on ? 'white' : 'var(--warm-gray)',
    border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => setOpen(true)} style={pill(open)}>Open</button>
        <button onClick={() => setOpen(false)} style={pill(!open)}>Resolved</button>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--warm-gray)', lineHeight: 1.5, marginBottom: '16px' }}>
        The database flags a listing when it goes live priced under half the median of five or more comparable live listings in its neighborhood, or with a photo another poster already uses. A flag is a prompt to look, not a verdict. A second live listing at the same address and unit is blocked outright and never reaches this list.
      </p>
      {rows === null ? (
        <div className="center" style={{ padding: '40px' }}><div className="spinner" /></div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--warm-gray)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>{open ? '✅' : '📋'}</div>
          <p style={{ fontSize: '14px' }}>{open ? 'No open flags.' : 'No resolved flags yet.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {rows.map(f => (
            <div key={f.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '16px' }}>{f.address}</div>
                  <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>Listing {f.listing_status} · poster {f.poster_email || '—'}</div>
                </div>
                <button onClick={() => navigate('/listing/' + f.listing_id)} className="btn-ghost" style={{ padding: '6px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  Open <ExternalLink size={12} />
                </button>
              </div>
              <div style={{ borderTop: '1px solid var(--sand-dark)', marginTop: '12px', paddingTop: '12px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><span style={{ color: 'var(--warm-gray)' }}>Why </span><strong>{flagLabel(f.kind)}</strong></div>
                {f.detail && <div style={{ color: 'var(--charcoal-soft)' }}>{f.detail}</div>}
                <div><span style={{ color: 'var(--warm-gray)' }}>Flagged </span>{new Date(f.created_at).toLocaleString()}</div>
                {f.resolved_at && (
                  <div><span style={{ color: 'var(--warm-gray)' }}>Resolved </span>{new Date(f.resolved_at).toLocaleString()}{f.resolution_note ? ` — ${f.resolution_note}` : ''}</div>
                )}
              </div>
              {!f.resolved_at && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input placeholder="Resolution note (optional)" value={note[f.id] || ''} maxLength={1000}
                    onChange={e => setNote(n => ({ ...n, [f.id]: e.target.value }))} style={{ padding: '10px 12px', fontSize: '14px' }} />
                  <button className="btn-primary" onClick={() => resolve(f)} disabled={busy === f.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: busy === f.id ? 0.7 : 1 }}>
                    <Check size={16} /> {busy === f.id ? 'Resolving…' : 'Mark resolved'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
