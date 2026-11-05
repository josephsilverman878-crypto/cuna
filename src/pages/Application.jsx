import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Save, Upload, Trash2, FileText, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import {
  APPLICATIONS_ENABLED, MAX_DOCUMENTS, getMyApplication, saveMyApplication, validateApplication,
  uploadDocument, deleteDocument, documentUrl, deleteMyApplication, documentLabel,
} from '../lib/applications'

const EMPTY = { employer: '', job_title: '', annual_income: '', move_in_date: '', current_address: '', references_list: [], notes: '', documents: [] }

// /application — the renter's reusable rental application. Filled once,
// shared only when the renter ticks the box on a tour request, deletable
// here at any time. Cuna charges no application fee.
export default function Application() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [app, setApp] = useState(null)
  const [exists, setExists] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!APPLICATIONS_ENABLED) { setApp(EMPTY); return }
    getMyApplication(user.id).then(({ data, error }) => {
      if (error) { console.error('Application load failed:', error); toast.error('Could not load your application') }
      setExists(Boolean(data))
      setApp(data ? { ...EMPTY, ...data, annual_income: data.annual_income ?? '', references_list: data.references_list || [] } : EMPTY)
    })
  }, [user.id])

  const set = (k, v) => setApp(a => ({ ...a, [k]: v }))
  const setRef = (i, k, v) => setApp(a => ({ ...a, references_list: a.references_list.map((r, j) => j === i ? { ...r, [k]: v } : r) }))

  async function save() {
    const problems = validateApplication(app)
    if (problems.length) { toast.error(problems[0]); return }
    setSaving(true)
    const { data, error } = await saveMyApplication(user.id, app)
    setSaving(false)
    if (error || !data) { toast.error(error?.message || 'Could not save'); return }
    setExists(true)
    setApp({ ...EMPTY, ...data, annual_income: data.annual_income ?? '', references_list: data.references_list || [] })
    toast.success('Application saved')
  }

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if ((app.documents || []).length >= MAX_DOCUMENTS) { toast.error(`Up to ${MAX_DOCUMENTS} documents`); return }
    setUploading(true)
    try {
      const path = await uploadDocument(user.id, file)
      const next = { ...app, documents: [...(app.documents || []), path] }
      const { data, error } = await saveMyApplication(user.id, next)
      if (error) throw error
      setExists(true)
      setApp({ ...EMPTY, ...data, annual_income: data.annual_income ?? '', references_list: data.references_list || [] })
      toast.success('Document added')
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function removeDoc(path) {
    const { error } = await deleteDocument(path)
    if (error) { toast.error(error.message || 'Could not delete'); return }
    const next = { ...app, documents: app.documents.filter(p => p !== path) }
    const { data } = await saveMyApplication(user.id, next)
    if (data) setApp({ ...EMPTY, ...data, annual_income: data.annual_income ?? '', references_list: data.references_list || [] })
    toast.success('Document deleted')
  }

  async function openDoc(path) {
    try { window.open(await documentUrl(path), '_blank', 'noopener') }
    catch (err) { toast.error(err.message || 'Could not open the file') }
  }

  async function deleteAll() {
    if (!window.confirm('Delete your application and every document in it? Applications you already shared with an agent stay with that request.')) return
    const { error } = await deleteMyApplication(user.id, app.documents || [])
    if (error) { toast.error(error.message || 'Could not delete'); return }
    setApp(EMPTY); setExists(false)
    toast.success('Application deleted')
  }

  if (app === null) return <div className="center" style={{ height: '100dvh' }}><div className="spinner" /></div>

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '100px' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)', padding: '16px 24px',
        position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex' }}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, margin: 0 }}>Rental application</h1>
          <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>Fill it in once, share it only when you choose</div>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {!APPLICATIONS_ENABLED && (
          <div className="card" style={{ padding: '16px 18px', background: 'rgba(196,113,74,0.06)', border: '1px solid rgba(196,113,74,0.25)', fontSize: '13px' }}>
            Applications are not switched on for this deployment yet.
          </div>
        )}
        <div className="card" style={{ padding: '16px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <ShieldCheck size={18} color="var(--like-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--charcoal-soft)' }}>
            Only you can see this page. An agent sees it only when you tick “share my application” on a tour request, and then only that agent. Cuna charges no application fee and never asks for your Social Security number, bank or card numbers, or where your income comes from.
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0 }}>Work</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label className="label">Employer</label><input value={app.employer || ''} maxLength={120} onChange={e => set('employer', e.target.value)} style={{ marginTop: '6px' }} /></div>
            <div><label className="label">Job title</label><input value={app.job_title || ''} maxLength={120} onChange={e => set('job_title', e.target.value)} style={{ marginTop: '6px' }} /></div>
          </div>
          <div>
            <label className="label">Annual income ($)</label>
            <input type="number" min="0" step="1000" placeholder="e.g. 85000" value={app.annual_income} onChange={e => set('annual_income', e.target.value)} style={{ marginTop: '6px' }} />
            <div style={{ fontSize: '11px', color: 'var(--warm-gray)', marginTop: '4px' }}>The amount only. Many landlords look for income around 40 times the monthly rent; vouchers and other lawful income count the same.</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0 }}>Move</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label className="label">Move-in date</label><input type="date" value={app.move_in_date || ''} onChange={e => set('move_in_date', e.target.value)} style={{ marginTop: '6px' }} /></div>
            <div><label className="label">Current address</label><input value={app.current_address || ''} maxLength={200} onChange={e => set('current_address', e.target.value)} style={{ marginTop: '6px' }} /></div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0 }}>References</h2>
            {app.references_list.length < 3 && (
              <button className="btn-ghost" onClick={() => set('references_list', [...app.references_list, { name: '', relationship: '', contact: '' }])} style={{ fontSize: '12px', padding: '6px 10px' }}>+ Add</button>
            )}
          </div>
          {app.references_list.length === 0 && <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>A former landlord or an employer, up to three.</p>}
          {app.references_list.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px', background: 'var(--sand)', borderRadius: '10px' }}>
              <input placeholder="Name" value={r.name} maxLength={80} onChange={e => setRef(i, 'name', e.target.value)} />
              <input placeholder="Relationship (e.g. former landlord)" value={r.relationship} maxLength={60} onChange={e => setRef(i, 'relationship', e.target.value)} />
              <input placeholder="Email or phone" value={r.contact} maxLength={120} onChange={e => setRef(i, 'contact', e.target.value)} style={{ gridColumn: '1 / 2' }} />
              <button className="btn-ghost" onClick={() => set('references_list', app.references_list.filter((_, j) => j !== i))} style={{ fontSize: '12px', padding: '8px' }}>Remove</button>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0 }}>Notes</h2>
          <textarea rows={3} maxLength={1000} placeholder="Anything an agent should know, e.g. a guarantor or a flexible start date." value={app.notes || ''} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0 }}>Documents</h2>
            <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png" onChange={onFile} style={{ display: 'none' }} />
            <button className="btn-ghost" disabled={uploading || !APPLICATIONS_ENABLED || (app.documents || []).length >= MAX_DOCUMENTS} onClick={() => fileRef.current?.click()} style={{ fontSize: '12px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Upload size={13} /> {uploading ? 'Uploading…' : 'Add a file'}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: 0, lineHeight: 1.5 }}>Pay stubs, an employment letter or ID, as PDF, JPEG or PNG up to 10 MB, up to {MAX_DOCUMENTS}. Stored privately; black out account numbers before uploading.</p>
          {(app.documents || []).map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <FileText size={14} color="var(--terracotta)" />
              <button type="button" onClick={() => openDoc(p)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--charcoal)', flex: 1, textAlign: 'left', fontSize: '13px' }}>{documentLabel(p)}</button>
              <button type="button" onClick={() => removeDoc(p)} aria-label="Delete document" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex' }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        <button className="btn-primary w-full" onClick={save} disabled={saving || !APPLICATIONS_ENABLED} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: saving || !APPLICATIONS_ENABLED ? 0.7 : 1 }}>
          <Save size={16} /> {saving ? 'Saving…' : 'Save application'}
        </button>
        {exists && (
          <button onClick={deleteAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pass-red)', fontSize: '13px', fontWeight: 600, padding: '6px' }}>
            Delete my application and documents
          </button>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
