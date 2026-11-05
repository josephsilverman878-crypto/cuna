import { useState } from 'react'
import { X, Flag } from 'lucide-react'
import toast from 'react-hot-toast'
import { REPORT_REASONS, fileReport } from '../lib/reports'

// "Report this listing" modal. Signed-in users only (the caller checks).
// One insert into listing_reports; the database limits it to five a day and
// one per listing per week and answers with a plain-English message.
export default function ReportListing({ listing, userId, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!reason) { toast.error('Pick a reason'); return }
    setBusy(true)
    const { error } = await fileReport(userId, listing.id, reason, note.trim())
    setBusy(false)
    if (error) {
      console.error('Report failed:', error)
      toast.error(error.message || 'Could not send the report')
      return
    }
    toast.success('Thanks. We will take a look.')
    onDone?.()
    onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(44,36,32,0.45)', zIndex: 200 }} />
      <div role="dialog" aria-modal="true" aria-label="Report this listing" style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 201, maxWidth: '600px', margin: '0 auto',
        background: 'var(--white)', borderRadius: '20px 20px 0 0', boxShadow: 'var(--shadow-lg)',
        padding: '16px 20px max(20px, env(safe-area-inset-bottom))', maxHeight: '88dvh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flag size={18} color="var(--terracotta)" /> Report this listing
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex' }}>
            <X size={22} />
          </button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: '0 0 14px', lineHeight: 1.5 }}>
          {listing.address}. Reports go to Cuna, not to the poster.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {REPORT_REASONS.map(r => (
            <label key={r.value} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
              border: `1.5px solid ${reason === r.value ? 'var(--terracotta)' : 'var(--sand-dark)'}`,
              background: reason === r.value ? 'rgba(196,113,74,0.08)' : 'var(--white)', fontSize: '14px',
            }}>
              <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--terracotta)' }} />
              {r.label}
            </label>
          ))}
        </div>
        <label className="label" htmlFor="report-note">Anything else? (optional)</label>
        <textarea id="report-note" rows={3} maxLength={1000} value={note} onChange={e => setNote(e.target.value)}
          placeholder="What should we know?" style={{ marginTop: '6px', resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1, padding: '12px' }}>Cancel</button>
          <button type="button" className="btn-primary" onClick={submit} disabled={busy} style={{ flex: 2, padding: '12px', opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Sending…' : 'Send report'}
          </button>
        </div>
      </div>
    </>
  )
}
