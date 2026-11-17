import { useEffect, useState } from 'react'
import { aiFeature } from '../lib/ai'

// The stored write-up on a neighborhood page (AI phase 3). Written once by
// Cuna's assistant when an admin asks for it, kept in the database, and
// only read here: opening a page never calls the model. Renders nothing
// when the assistant is off, when there is no write-up, or when an admin
// has hidden it.
export default function NeighborhoodWriteup({ slug }) {
  const [w, setW] = useState(null)
  const on = aiFeature('writeup')

  useEffect(() => {
    if (!on || !slug) return
    let cancelled = false
    setW(null)
    fetch('/api/ai?feature=writeup&slug=' + encodeURIComponent(slug))
      .then(r => r.json())
      .then(j => { if (!cancelled && j?.ok && j.output?.body) setW(j.output) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [on, slug])

  if (!on || !w) return null
  const date = w.generated_at ? new Date(w.generated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }) : null
  return (
    <section className="card" style={{ padding: '18px 20px' }}>
      {w.body.split(/\n{2,}/).map((para, i) => (
        <p key={i} style={{ fontSize: '14px', lineHeight: 1.65, margin: i === 0 ? 0 : '10px 0 0' }}>{para}</p>
      ))}
      <p style={{ fontSize: '12px', color: 'var(--warm-gray)', lineHeight: 1.5, margin: '12px 0 0' }}>
        {w.label || "Written by Cuna's assistant from public data"}{date ? `, ${date}` : ''}.
      </p>
      {w.sources?.length > 0 && (
        <details style={{ marginTop: '6px' }}>
          <summary style={{ fontSize: '12px', color: 'var(--terracotta)', cursor: 'pointer' }}>Sources</summary>
          <ul style={{ margin: '6px 0 0', paddingLeft: '18px', fontSize: '11px', color: 'var(--warm-gray)', lineHeight: 1.5 }}>
            {w.sources.map((s, i) => (
              <li key={i}>{s.label}: {s.source}, {s.as_of}. Area: {s.boundary}.</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
