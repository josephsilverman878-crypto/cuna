import { useMemo, useState } from 'react'
import { ClipboardCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { aiFeature, aiRequest } from '../lib/ai'
import { checkupItems } from '../lib/listingCheckup'
import AiLabel from './AiLabel'

// "Listing checkup" on the Review step of Post listing and Edit listing
// (poster assistant). It lists what is missing or weak before the poster
// submits, with one-tap fixes where a fix is possible. The list itself is
// plain rules (src/lib/listingCheckup.js): no model call and no cost. Only
// "Rewrite without it" asks the assistant, and its rewrite is a suggestion
// the poster must accept. Nothing here saves the listing.
export default function ListingCheckup({ form, photoCount, neighborhoodName, videoOk, tourOk, update, setTab }) {
  const [busy, setBusy] = useState(false)
  const [rewrite, setRewrite] = useState(null)   // { text, removed }
  const [message, setMessage] = useState(null)
  const items = useMemo(
    () => checkupItems({ form, photoCount, neighborhoodName, videoOk, tourOk }),
    [form, photoCount, neighborhoodName, videoOk, tourOk],
  )
  if (!aiFeature('poster')) return null

  const must = items.filter(i => i.level === 'must')
  const should = items.filter(i => i.level === 'should')

  async function reword() {
    setBusy(true); setMessage(null); setRewrite(null)
    const r = await aiRequest('checkup', { description: form.description })
    setBusy(false)
    if (!r.ok) { setMessage(r.message); return }
    if (r.output?.kind === 'message') { setMessage(r.output.message); return }
    setRewrite({ text: r.output.text, removed: r.output.removed || [] })
  }

  function runFix(fix) {
    if (fix.reword) return reword()
    if (fix.set) { Object.entries(fix.set).forEach(([k, v]) => update(k, v)); return }
    if (typeof fix.tab === 'number') setTab(fix.tab)
  }

  const row = (item) => (
    <div key={item.id} style={{ borderTop: '1px solid var(--sand-dark)', padding: '12px 0' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <AlertTriangle size={15} color={item.level === 'must' ? 'var(--pass-red)' : 'var(--terracotta)'} style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>{item.title}</div>
          <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--charcoal-soft)', margin: '2px 0 0' }}>{item.detail}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            {item.fixes.map(fix => (
              <button key={fix.label} type="button" className="btn btn-secondary" disabled={fix.reword && busy}
                style={{ padding: '8px 12px', fontSize: '13px' }} onClick={() => runFix(fix)}>
                {fix.reword && busy ? 'Rewriting…' : fix.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <section className="card" aria-label="Listing checkup">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ClipboardCheck size={17} color="var(--terracotta)" aria-hidden="true" /> Listing checkup
      </h3>
      {items.length === 0 ? (
        <p style={{ fontSize: '14px', lineHeight: 1.5, margin: '6px 0 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <CheckCircle2 size={16} color="var(--like-green, #4CAF7D)" aria-hidden="true" /> Nothing missing. Read it through once more.
        </p>
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--charcoal-soft)', lineHeight: 1.5, margin: '0 0 8px' }}>
          {must.length > 0 ? `${must.length} to fix first` : 'Nothing is blocking'}
          {should.length > 0 ? `${must.length > 0 ? ', ' : '. '}${should.length} worth a look` : ''}.
        </p>
      )}
      {must.map(row)}
      {should.map(row)}

      {message && <p role="status" style={{ fontSize: '13px', lineHeight: 1.5, margin: '10px 0 0' }}>{message}</p>}
      {rewrite && (
        <div style={{ marginTop: '12px', background: 'var(--sand)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Suggested wording</div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{rewrite.text}</p>
          <p style={{ fontSize: '12px', color: 'var(--warm-gray)', lineHeight: 1.5, margin: '10px 0 0' }}>
            Read it before you use it; you are responsible for the description. It is checked for fair-housing wording again when you post.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            <button type="button" className="btn btn-primary" style={{ padding: '9px 14px', fontSize: '13px' }}
              onClick={() => { update('description', rewrite.text); setRewrite(null) }}>Use this wording</button>
            <button type="button" className="btn btn-secondary" style={{ padding: '9px 14px', fontSize: '13px' }} onClick={() => setRewrite(null)}>Dismiss</button>
          </div>
        </div>
      )}
      <AiLabel style={{ marginTop: '14px' }} />
    </section>
  )
}
