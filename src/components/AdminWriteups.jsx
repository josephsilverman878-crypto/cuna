import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { aiRequest } from '../lib/ai'

// /admin → AI → Neighborhood write-ups: write, rewrite, hide or show the
// assistant's summary for each neighborhood (admin_neighborhood_writeups,
// admin_set_writeup_hidden, 49-ai.sql). Writing one is one model call.
export default function AdminWriteups() {
  const [rows, setRows] = useState(null)
  const [missing, setMissing] = useState(false)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(null)
  const [preview, setPreview] = useState(null)

  async function load() {
    const { data, error } = await supabase.rpc('admin_neighborhood_writeups')
    if (error) {
      const notApplied = error.code === 'PGRST202' || error.code === '42883'
      setMissing(notApplied)
      if (!notApplied) { console.error('Write-ups failed:', error); toast.error('Could not load write-ups') }
    } else {
      setMissing(false)
    }
    setRows(data || [])
  }
  useEffect(() => { load() }, [])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = (rows || []).filter(r => !needle || r.name.toLowerCase().includes(needle) || r.borough.toLowerCase().includes(needle))
    return list.slice(0, 40)
  }, [rows, q])
  const written = (rows || []).filter(r => r.has_writeup).length

  async function write(r) {
    setBusy(r.slug)
    const res = await aiRequest('writeup', { slug: r.slug })
    setBusy(null)
    if (!res.ok) { toast.error(res.message || 'Could not write it'); return }
    setPreview(res.output)
    if (res.output.saved) { toast.success(`Saved for ${r.name}`); load() }
    else toast.error(res.output.save_error === 'tables_missing' ? 'Written, but not saved: run 49-ai.sql first' : 'Written, but it could not be saved')
  }

  async function setHidden(r, hidden) {
    setBusy(r.slug)
    const { error } = await supabase.rpc('admin_set_writeup_hidden', { p_neighborhood: r.neighborhood_id, p_hidden: hidden })
    setBusy(null)
    if (error) { toast.error(error.message || 'Could not change it'); return }
    toast.success(hidden ? 'Hidden from the page' : 'Shown on the page')
    load()
  }

  const small = { padding: '7px 12px', fontSize: '12px' }
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', boxShadow: 'var(--shadow-sm)', marginTop: '16px' }}>
      <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Neighborhood write-ups</h2>
      <p style={{ fontSize: '12px', color: 'var(--warm-gray)', lineHeight: 1.5, marginBottom: '12px' }}>
        A short factual summary shown on a neighborhood's page, written from Cuna's data and labelled as the assistant's. Writing one makes one model call; opening a page makes none.
        {rows && !missing ? ` ${written} of ${rows.length} written.` : ''}
      </p>
      {rows === null ? (
        <div className="center" style={{ padding: '24px' }}><div className="spinner" /></div>
      ) : missing ? (
        <p style={{ fontSize: '13px', lineHeight: 1.5 }}>The write-up table is not in the database yet. Run <strong>49-ai.sql</strong> in the Supabase SQL editor, then reload.</p>
      ) : (
        <>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find a neighborhood" aria-label="Find a neighborhood"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--sand-dark)', fontSize: '14px', marginBottom: '8px' }} />
          {shown.map(r => (
            <div key={r.slug} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 0', borderTop: '1px solid var(--sand-dark)', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '120px', flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--warm-gray)' }}>
                  {r.borough} · {!r.has_writeup ? 'Not written' : r.hidden ? 'Hidden' : 'On the page'}
                  {r.generated_at ? ` · ${new Date(r.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-secondary" style={small} disabled={busy === r.slug} onClick={() => write(r)}>
                  {busy === r.slug ? 'Working…' : r.has_writeup ? 'Rewrite' : 'Write'}
                </button>
                {r.has_writeup && (
                  <button className="btn btn-secondary" style={small} disabled={busy === r.slug} onClick={() => setHidden(r, !r.hidden)}>
                    {r.hidden ? 'Show' : 'Hide'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {rows.length > shown.length && !q && (
            <p style={{ fontSize: '12px', color: 'var(--warm-gray)', marginTop: '8px' }}>Showing the first {shown.length}. Type a name to find the rest.</p>
          )}
        </>
      )}
      {preview && (
        <div style={{ marginTop: '12px', borderTop: '1px solid var(--sand-dark)', paddingTop: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>{preview.name}{preview.fallback ? ' (plain facts: the wording check failed twice)' : ''}</div>
          <p style={{ fontSize: '13px', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{preview.body}</p>
        </div>
      )}
    </div>
  )
}
