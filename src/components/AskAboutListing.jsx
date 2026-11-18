import { useState } from 'react'
import { MessageCircleQuestion } from 'lucide-react'
import { aiFeature, aiRequest } from '../lib/ai'
import AiLabel from './AiLabel'

// "Ask about this listing" on the listing page (AI phase 4). The answer
// comes only from this listing's own details, its Cuna neighborhood and
// the subway stations near it. When those do not hold the answer the
// assistant says so and the page offers the existing "Ask the agent".
// When web search is switched on (server side), a question Cuna's data
// cannot answer is looked up on the web instead; that answer is labelled
// "From the web" and links every page it cites.
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
    setRes({ text: r.output.answer, answered: r.output.answered, web: r.output.web === true, sources: r.output.sources || [] })
  }

  return (
    <section className="card" style={{ padding: '18px 20px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageCircleQuestion size={18} color="var(--terracotta)" aria-hidden="true" /> Ask about this listing
      </h2>
      <p style={{ fontSize: '12px', color: 'var(--warm-gray)', lineHeight: 1.5, margin: '0 0 10px' }}>
        Answers come from this listing's details and the subway stations near it. If those do not cover your question, the assistant may search the web and link its sources.
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
          {res.web && <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', color: 'var(--warm-gray)', marginBottom: '4px' }}>From the web, not from Cuna's data</div>}
          <p style={{ fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{res.text}</p>
          {res.web && res.sources.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '12px', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--warm-gray)' }}>Sources: </span>
              {res.sources.map((s, i) => (
                <span key={s.url}>
                  {i > 0 && ' · '}
                  <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" style={{ color: 'var(--terracotta)', overflowWrap: 'anywhere' }}>{s.title}</a>
                </span>
              ))}
              <div style={{ color: 'var(--warm-gray)', marginTop: '2px' }}>Check the source before relying on it.</div>
            </div>
          )}
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
