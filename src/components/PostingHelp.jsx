import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LifeBuoy } from 'lucide-react'
import { aiFeature, aiRequest } from '../lib/ai'
import AiLabel from './AiLabel'

// "Posting help" on the poster dashboard (poster assistant). Answers come
// only from the Help page and the rules the posting forms enforce. When
// they do not hold the answer the box says so and gives the address a
// person reads. Nothing is kept: the question and answer live here only.
const CONTACT = 'hello@hellocuna.com'

export default function PostingHelp() {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState(null)   // { text, answered }
  if (!aiFeature('poster')) return null

  async function submit(e) {
    e.preventDefault()
    if (q.trim().length < 3 || busy) return
    setBusy(true); setRes(null)
    const r = await aiRequest('posting_help', { question: q.trim() })
    setBusy(false)
    if (!r.ok) { setRes({ text: r.message, answered: true }); return }
    if (r.output?.kind === 'message') { setRes({ text: r.output.message, answered: true }); return }
    setRes({ text: r.output.answer, answered: r.output.answered })
  }

  return (
    <section className="card" style={{ padding: '18px 20px' }} aria-label="Posting help">
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <LifeBuoy size={18} color="var(--terracotta)" aria-hidden="true" /> Posting help
      </h2>
      <p style={{ fontSize: '12px', color: 'var(--warm-gray)', lineHeight: 1.5, margin: '0 0 10px' }}>
        Ask how posting works on Cuna. Answers come from the <Link to="/help" style={{ color: 'var(--terracotta)' }}>Help page</Link> and the posting rules.
      </p>
      <form onSubmit={submit} style={{ display: 'flex', gap: '8px' }}>
        <input value={q} onChange={e => setQ(e.target.value)} maxLength={300} aria-label="Your question about posting"
          placeholder="How many photos do I need?"
          style={{ flex: 1, minWidth: 0, padding: '11px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--sand-dark)', background: 'var(--white)', fontSize: '14px', fontFamily: 'var(--font-body)' }} />
        <button type="submit" className="btn btn-primary" disabled={q.trim().length < 3 || busy} style={{ padding: '0 16px', fontSize: '14px' }}>
          {busy ? '…' : 'Ask'}
        </button>
      </form>
      {res && (
        <div role="status" style={{ marginTop: '12px' }}>
          <p style={{ fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{res.text}</p>
          {!res.answered && (
            <a href={`mailto:${CONTACT}`} className="btn btn-secondary" style={{ display: 'inline-block', padding: '9px 14px', fontSize: '13px', marginTop: '10px', textDecoration: 'none' }}>
              Write to {CONTACT}
            </a>
          )}
        </div>
      )}
      <AiLabel style={{ marginTop: '12px' }} />
    </section>
  )
}
