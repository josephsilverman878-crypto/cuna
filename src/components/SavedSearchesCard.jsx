import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Pencil, Trash2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { listSavedSearches, updateSavedSearch, deleteSavedSearch } from '../lib/savedSearches'
import { describeFilters } from '../lib/search'
import { listNeighborhoods } from '../lib/areas'

// Profile card: the renter's saved searches, with show / rename / delete.
// Rows come from public.saved_searches (own rows only, by RLS).
export default function SavedSearchesCard({ userId }) {
  const navigate = useNavigate()
  const [rows, setRows] = useState(null)
  const [hoods, setHoods] = useState([])
  const [editing, setEditing] = useState(null)   // { id, name }
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([listSavedSearches(userId), listNeighborhoods().catch(() => [])]).then(([{ data, error }, list]) => {
      if (cancelled) return
      if (error) { console.error('Saved searches failed:', error); toast.error('Could not load your saved searches') }
      setRows(data || [])
      setHoods(list)
    })
    return () => { cancelled = true }
  }, [userId])

  const nameOf = useMemo(() => new Map(hoods.map(h => [h.id, h.name])), [hoods])

  async function rename() {
    const name = editing.name.trim()
    if (!name) { toast.error('Give the search a name'); return }
    setBusy(editing.id)
    const { data, error } = await updateSavedSearch(userId, editing.id, { name })
    setBusy(null)
    if (error) { toast.error(error.message || 'Could not rename'); return }
    setRows(prev => prev.map(r => r.id === data.id ? data : r))
    setEditing(null)
  }

  async function remove(row) {
    if (!window.confirm(`Delete the saved search "${row.name}"? You will stop getting alerts for it.`)) return
    setBusy(row.id)
    const { error } = await deleteSavedSearch(userId, row.id)
    setBusy(null)
    if (error) { toast.error(error.message || 'Could not delete'); return }
    setRows(prev => prev.filter(r => r.id !== row.id))
    toast.success('Saved search deleted')
  }

  return (
    <div className="card">
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '4px' }}>Saved searches</h2>
      <p style={{ fontSize: '12px', color: 'var(--warm-gray)', marginBottom: '14px', lineHeight: 1.5 }}>
        Save a search from the feed and you'll get a bell notification whenever a new listing matches.
        Up to 20.
      </p>
      {rows === null ? (
        <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>Loading…</p>
      ) : rows.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>
          No saved searches yet. In the feed, set your filters or pick areas on the map, then tap "Save search".
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map(row => {
            const names = (row.neighborhood_ids || []).map(id => nameOf.get(id)).filter(Boolean)
            const summary = describeFilters(row.filters, names, Boolean(row.area_geojson))
            const isEditing = editing?.id === row.id
            return (
              <div key={row.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--sand-dark)' }}>
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input value={editing.name} maxLength={80} autoFocus aria-label="Search name"
                      onChange={e => setEditing(ed => ({ ...ed, name: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') rename(); if (e.key === 'Escape') setEditing(null) }}
                      style={{ padding: '8px 10px', fontSize: '14px' }} />
                    <button type="button" onClick={rename} disabled={busy === row.id} aria-label="Save name" className="btn-primary" style={{ padding: '8px 10px', display: 'flex' }}><Check size={16} /></button>
                    <button type="button" onClick={() => setEditing(null)} aria-label="Cancel rename" className="btn-ghost" style={{ padding: '8px', display: 'flex' }}><X size={16} /></button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--charcoal)' }}>{row.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--warm-gray)', marginTop: '2px', lineHeight: 1.5 }}>{summary}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                        <button type="button" onClick={() => setEditing({ id: row.id, name: row.name })} aria-label={`Rename ${row.name}`} className="btn-ghost" style={{ padding: '8px', display: 'flex' }}><Pencil size={16} /></button>
                        <button type="button" onClick={() => remove(row)} disabled={busy === row.id} aria-label={`Delete ${row.name}`} className="btn-ghost" style={{ padding: '8px', display: 'flex', color: 'var(--pass-red)' }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <button type="button" onClick={() => navigate('/feed?saved=' + row.id)} className="btn-secondary"
                      style={{ marginTop: '8px', padding: '8px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Search size={14} /> Show listings
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
