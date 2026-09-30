import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Train, Clock, Check, Info } from 'lucide-react'
import { STORAGE_KEY, describeAnswers } from '../lib/quizQuestions'
import { NEIGHBORHOODS } from '../lib/neighborhoods'
import { matchNeighborhoods, askedPriceRange } from '../lib/neighborhoodMatch'

function loadAnswers() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && parsed.answers && Object.keys(parsed.answers).length ? parsed.answers : null
  } catch {
    return null
  }
}

function Shell({ children }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #F5F0E8 0%, #EDE6D6 100%)',
    }}>
      <header style={{ padding: '20px 24px' }}>
        <Link to="/" style={{
          fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 600,
          color: 'var(--terracotta)',
        }}>
          cuna
        </Link>
      </header>
      <main style={{ padding: '8px 24px 64px' }}>
        <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}

function NeighborhoodCard({ result, answers, rank }) {
  const n = result.neighborhood
  const priced = askedPriceRange(answers, n)

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 600,
            lineHeight: 1.15, margin: 0,
          }}>
            {n.name}
          </h2>
          <span style={{
            fontSize: '12px', fontWeight: 600, color: 'var(--terracotta)',
            letterSpacing: '0.5px', flexShrink: 0,
          }}>
            #{rank}
          </span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--warm-gray)', marginTop: '2px' }}>
          {n.borough}
        </div>

        <p style={{
          fontSize: '14px', color: 'var(--charcoal-soft)', lineHeight: 1.6, margin: '14px 0 0',
        }}>
          {n.description}
        </p>
      </div>

      {result.reasons.length > 0 && (
        <div style={{ padding: '16px 20px 0' }}>
          <div className="label" style={{ marginBottom: '8px' }}>Why this fits</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {result.reasons.map(reason => (
              <li key={reason} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Check size={15} color="var(--like-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--charcoal)' }}>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.caveats.length > 0 && (
        <div style={{ padding: '16px 20px 0' }}>
          <div className="label" style={{ marginBottom: '8px' }}>Worth knowing</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {result.caveats.map(caveat => (
              <li key={caveat} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Info size={14} color="var(--warm-gray)" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--warm-gray)' }}>{caveat}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{
        margin: '18px 0 0', padding: '14px 20px',
        borderTop: '1px solid var(--sand-dark)',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        {priced && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px' }}>
            <span style={{ color: 'var(--warm-gray)' }}>{priced.label}</span>
            <span style={{ fontWeight: 600, color: 'var(--terracotta)', textAlign: 'right' }}>{priced.text}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px' }}>
          <Train size={14} color="var(--warm-gray)" style={{ flexShrink: 0, marginTop: '3px' }} />
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {n.subway_lines.map(line => (
              <span key={line} className="tag" style={{ padding: '2px 8px', fontSize: '11px' }}>{line}</span>
            ))}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--charcoal-soft)' }}>
          <Clock size={14} color="var(--warm-gray)" style={{ flexShrink: 0 }} />
          <span>
            ~{n.commute_minutes.midtown} min to Midtown · ~{n.commute_minutes.downtown_fidi} min to the Financial District
          </span>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--warm-gray)', fontStyle: 'italic' }}>
          {n.data_note}
        </div>
      </div>
    </div>
  )
}

export default function NewToNYResults() {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setAnswers(loadAnswers())
    setLoaded(true)
  }, [])

  if (!loaded) return <Shell>{null}</Shell>

  // Nothing saved at all — the visitor has not taken the quiz on this device.
  if (!answers) {
    return (
      <Shell>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 6.5vw, 44px)',
          fontWeight: 500, lineHeight: 1.1, marginBottom: '12px',
        }}>
          No answers saved yet
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--warm-gray)', lineHeight: 1.6, marginBottom: '28px' }}>
          Take the quiz and we'll show you the neighborhoods that fit.
        </p>
        <button className="btn-primary" onClick={() => navigate('/new-to-ny')}>
          Take the quiz
        </button>
      </Shell>
    )
  }

  const results = matchNeighborhoods(answers, NEIGHBORHOODS)
  const top = results.slice(0, 3)
  const summary = describeAnswers(answers)

  return (
    <Shell>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 6.5vw, 44px)',
        fontWeight: 500, lineHeight: 1.1, marginBottom: '10px',
      }}>
        {top.length ? 'Your neighborhoods' : 'No matches yet'}
      </h1>

      {top.length > 0 ? (
        <>
          <p style={{ fontSize: '15px', color: 'var(--warm-gray)', lineHeight: 1.6, marginBottom: '28px' }}>
            Based on what you told us, these {top.length === 1 ? 'is the closest fit' : `${top.length} fit best`}.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {top.map((result, i) => (
              <NeighborhoodCard
                key={result.neighborhood.id}
                result={result}
                answers={answers}
                rank={i + 1}
              />
            ))}
          </div>
        </>
      ) : (
        // Deliberately show nothing rather than pad the page with bad matches.
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '15px', color: 'var(--charcoal)', lineHeight: 1.6, marginBottom: '8px' }}>
            Nothing in our current data fits that budget. Try adjusting it.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--warm-gray)', lineHeight: 1.6, marginBottom: '20px' }}>
            We would rather show you nothing than a place you cannot afford.
          </p>
          <button className="btn-primary" onClick={() => navigate('/new-to-ny')}>
            Adjust your answers
          </button>
        </div>
      )}

      <details style={{ marginTop: '28px' }}>
        <summary style={{
          cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: 'var(--terracotta)',
          padding: '10px 0', listStyle: 'revert',
        }}>
          Your answers
        </summary>
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '10px' }}>
          {summary.map((row, i) => (
            <div key={row.id} style={{
              padding: '12px 16px',
              borderTop: i === 0 ? 'none' : '1px solid var(--sand-dark)',
            }}>
              <div className="label" style={{ marginBottom: '3px' }}>{row.prompt}</div>
              <div style={{ fontSize: '14px', color: 'var(--charcoal)', lineHeight: 1.5 }}>{row.value}</div>
            </div>
          ))}
        </div>
      </details>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
        <button className="btn-secondary" onClick={() => navigate('/new-to-ny')}>
          Retake the quiz
        </button>
      </div>
    </Shell>
  )
}
