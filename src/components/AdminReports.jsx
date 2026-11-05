import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminListReports, adminResolveReport, reasonLabel } from '../lib/reports'

// /admin → Reports: every listing report, open or resolved, with a resolve
// button. Reads and writes go through the admin_* functions, which check
// is_admin in the database.
export default function AdminReports() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('open')
  const [rows, setRows] = useState(null)
  const [note, setNote] = useState({})
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    let cancelled = false
    setRows(null)
    adminListReports(status).then(({ data, error }) => {
      if (cancelled) return
      if (error) { console.error('Reports failed:', error); toast.error('Could not load reports') }
      setRows(data || [])
    })
    return () => { cancelled = true }
  }, [status])

  async function resolve(r) {
    setBusy(r.id)
    const { data, error } = await adminResolveReport(r.id, note[r.id])
    setBusy(null)
    if (error) { toast.error(error.message || 'Could not resolve'); return }
    if (!data) { toast.error('Already resolved'); }
    setRows(prev => prev.filter(x => x.id !== r.id))
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
        <button onClick={() => setStatus('open')} style={pill(status === 'open')}>Open</button>
        <button onClick={() => setStatus('resolved')} style={pill(status === 'resolved')}>Resolved</button>
      </div>
      {rows === null ? (
        <div className="center" style={{ padding: '40px' }}><div className="spinner" /></div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--warm-gray)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>{status === 'open' ? '✅' : '📋'}</div>
          <p style={{ fontSize: '14px' }}>{status === 'open' ? 'No open reports.' : 'No resolved reports yet.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {rows.map(r => (
            <div key={r.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '16px' }}>{r.address}</div>
                  <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>
                    Listing {r.listing_status} · poster {r.poster_email || '—'}
                  </div>
                </div>
                <button onClick={() => navigate('/listing/' + r.listing_id)} className="btn-ghost" style={{ padding: '6px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  Open <ExternalLink size={12} />
                </button>
              </div>
              <div style={{ borderTop: '1px solid var(--sand-dark)', marginTop: '12px', paddingTop: '12px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><span style={{ color: 'var(--warm-gray)' }}>Reason </span><strong>{reasonLabel(r.reason)}</strong></div>
                {r.note && <div><span style={{ color: 'var(--warm-gray)' }}>Note </span>{r.note}</div>}
                <div><span style={{ color: 'var(--warm-gray)' }}>From </span>{r.reporter_email || '—'} · {new Date(r.created_at).toLocaleString()}</div>
                {r.status === 'resolved' && (
                  <div><span style={{ color: 'var(--warm-gray)' }}>Resolved </span>{r.resolved_at ? new Date(r.resolved_at).toLocaleString() : ''}{r.resolution_note ? ` — ${r.resolution_note}` : ''}</div>
                )}
              </div>
              {r.status === 'open' && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input placeholder="Resolution note (optional)" value={note[r.id] || ''} maxLength={1000}
                    onChange={e => setNote(n => ({ ...n, [r.id]: e.target.value }))} style={{ padding: '10px 12px', fontSize: '14px' }} />
                  <button className="btn-primary" onClick={() => resolve(r)} disabled={busy === r.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: busy === r.id ? 0.7 : 1 }}>
                    <Check size={16} /> {busy === r.id ? 'Resolving…' : 'Mark resolved'}
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
