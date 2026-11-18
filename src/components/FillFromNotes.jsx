import { useState } from 'react'
import { ClipboardPaste } from 'lucide-react'
import { aiFeature, aiRequest } from '../lib/ai'
import { buildFill } from '../lib/fillFromNotes'
import AiLabel from './AiLabel'

// "Fill from notes" on Post listing (poster assistant). The poster pastes
// raw notes; the assistant returns only fields the notes state, each with
// the words it came from (the server throws away anything it cannot find
// in the notes). This component turns that into a patch for the form.
//
// Nothing is saved: the form is filled, every filled field is outlined for
// review, and a field the poster had already typed is never overwritten.
// The notes are sent to the AI provider for this one request and are not
// stored by Cuna.

export default function FillFromNotes({ form, onApply, onUndo, onDone }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [result, setResult] = useState(null)   // { rows, kept, remarks, before }
  if (!aiFeature('poster')) return null

  async function run() {
    if (notes.trim().length < 20 || busy) return
    setBusy(true); setMessage(null); setResult(null)
    const r = await aiRequest('fill_notes', { notes })
    setBusy(false)
    if (!r.ok) { setMessage(r.message); return }
    if (r.output?.kind === 'message') { setMessage(r.output.message); return }
    const fill = buildFill(r.output, form)
    if (fill.keys.length === 0) {
      setMessage(fill.kept.length
        ? 'Everything the notes state is already filled in. Nothing was changed.'
        : 'The notes did not state anything the form could use. Nothing was changed.')
      if (r.output.remarks?.length) setResult({ rows: [], kept: fill.kept, remarks: r.output.remarks, before: null })
      return
    }
    onApply(fill.patch, fill.keys)
    setResult({ rows: fill.rows, kept: fill.kept, remarks: r.output.remarks || [], before: form })
  }

  const small = { padding: '9px 14px', fontSize: '13px' }
  return (
    <section className="card" aria-label="Fill from notes">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ClipboardPaste size={17} color="var(--terracotta)" aria-hidden="true" /> Fill from notes
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--charcoal-soft)', lineHeight: 1.55, margin: '0 0 10px' }}>
        Paste your notes about the home: an email, a text, a list. The assistant fills in only what the notes say and outlines every field it filled, so you can check each one. Anything the notes do not mention stays empty.
      </p>
      {!open ? (
        <button type="button" className="btn btn-secondary" style={small} onClick={() => setOpen(true)}>Paste notes</button>
      ) : (
        <>
          <textarea rows={5} maxLength={6000} value={notes} onChange={e => setNotes(e.target.value)} aria-label="Your notes about the home"
            placeholder={'245 Example St, Apt 3B, Brooklyn 11215\n2 bed 1 bath, 850 sq ft, $3,500/mo, 12 month lease\nNo application fee, deposit $3,500. Cats ok. Dishwasher, elevator.'}
            style={{ width: '100%', resize: 'vertical', fontSize: '14px' }} />
          <p style={{ fontSize: '12px', color: 'var(--warm-gray)', lineHeight: 1.5, margin: '8px 0 10px' }}>
            Your notes are sent to Cuna's AI provider to read them, and are not stored. Nothing is saved to your listing until you press Post listing.
          </p>
          <button type="button" className="btn btn-primary" style={small} disabled={busy || notes.trim().length < 20} onClick={run}>
            {busy ? 'Reading your notes…' : 'Fill the form from my notes'}
          </button>
        </>
      )}

      {message && <p role="status" style={{ fontSize: '13px', lineHeight: 1.5, margin: '12px 0 0' }}>{message}</p>}
      {result && (
        <div role="status" style={{ marginTop: '14px', background: 'var(--sand)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
          {result.rows.length > 0 && (
            <>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>
                Filled {result.rows.length} {result.rows.length === 1 ? 'field' : 'fields'}. Check each one.
              </div>
              <p style={{ fontSize: '12px', color: 'var(--charcoal-soft)', lineHeight: 1.5, margin: '0 0 8px' }}>
                Filled fields are outlined on every step of the form. The words under each one are where it came from in your notes.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.rows.map((row, i) => (
                  <li key={i} style={{ fontSize: '13px', lineHeight: 1.45 }}>
                    <span style={{ color: 'var(--warm-gray)' }}>{row.label}: </span><strong>{row.value}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--warm-gray)', overflowWrap: 'anywhere' }}>“{row.quote}”</div>
                  </li>
                ))}
              </ul>
            </>
          )}
          {result.kept.length > 0 && (
            <p style={{ fontSize: '12px', color: 'var(--charcoal-soft)', lineHeight: 1.5, margin: '10px 0 0' }}>
              Left as you typed it: {result.kept.join(', ')}.
            </p>
          )}
          {result.remarks.map((t, i) => (
            <p key={i} style={{ fontSize: '12px', color: 'var(--charcoal-soft)', lineHeight: 1.5, margin: '10px 0 0' }}>{t}</p>
          ))}
          {result.before && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary" style={small} onClick={() => { onDone(); setResult(null) }}>I've checked them</button>
              <button type="button" className="btn btn-secondary" style={small} onClick={() => { onUndo(result.before); setResult(null) }}>Undo the fill</button>
            </div>
          )}
        </div>
      )}
      <AiLabel style={{ marginTop: '14px' }} />
    </section>
  )
}
