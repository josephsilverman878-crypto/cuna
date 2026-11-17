import { useState } from 'react'
import { MessageCircleQuestion } from 'lucide-react'
import { aiFeature, aiRequest } from '../lib/ai'
import AiLabel from './AiLabel'

// "Ask about this listing" on the listing page (AI phase 4). The answer
// comes only from this listing's own details, its Cuna neighborhood and
// the subway stations near it. When those do not hold the answer the
// assistant says so and the page offers the existing "Ask the agent".
// Nothing is kept: the question and answer live in this component only.
export default function AskAboutListing({ listingId, onAskAgent }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState(null)
  if (!aiFeature('listing_qa') || !listingId) return null

  async function submit(e) {
    e.preventDefault()
    if (q.trim().length < 3 || busy) return
    setBusy(true); setRes(null)
    const r = await aiRequest('listing_qa', { listing_id: listingId, question: q.trim() })
    setBusy(false)
    if (!r.ok) { setRes({ text: r.message, answered: false, soft: true }); return }
    if (r.output?.kind === 'message') { setRes({ text: r.output.message, answered: true, soft: true }); return }
    setRes({ text: r.output.answer, answered: r.output.answered })
  }

  return (
    <section className="card" style={{ padding: '18px 20px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageCircleQuestion size={18} color="var(--terracotta)" aria-hidden="true" /> Ask about this listing
      </h2>
      <p style={{ fontSize: '12px', color: 'var(--warm-gray)', lineHeight: 1.5, margin: '0 0 10px' }}>
        Answers come only from this listing's details and the subway stations near it.
      </p>
      <form onSubmit={submit} style={{ display: 'flex', gap: '8px' }}>
        <input value={q} onChange={e => setQ(e.target.value)} maxLength={300} aria-label="Your question about this listing"
          placeholder="Are cats allowed? What are the fees?"
          style={{ flex: 1, minWidth: 0, padding: '11px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--sand-dark)', background: 'var(--white)', fontSize: '14px', fontFamily: 'var(--font-body)' }} />
        <button type="submit" className="btn btn-primary" disabled={q.trim().length < 3 || busy} style={{ padding: '0 16px', fontSize: '14px' }}>
          {busy ? '…' : 'Ask'}
        </button>
      </form>
      {res && (
        <div role="status" style={{ marginTop: '12px' }}>
          <p style={{ fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{res.text}</p>
          {!res.answered && onAskAgent && (
            <button type="button" className="btn btn-secondary" style={{ padding: '9px 14px', fontSize: '13px', marginTop: '10px' }} onClick={onAskAgent}>
              Ask the agent
            </button>
          )}
        </div>
      )}
      <AiLabel style={{ marginTop: '12px' }} />
    </section>
  )
}
