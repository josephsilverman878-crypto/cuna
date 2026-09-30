import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { STORAGE_KEY, describeAnswers } from '../lib/quizQuestions'

// Placeholder for step 3. This page currently exists to confirm the quiz saved
// what we expect — the readable dump below is for testing, not final UI.
export default function NewToNYResults() {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      setAnswers(parsed && parsed.answers ? parsed.answers : null)
    } catch {
      setAnswers(null)
    } finally {
      setLoaded(true)
    }
  }, [])

  const summary = answers ? describeAnswers(answers) : []

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

      <main style={{ padding: '24px 24px 64px' }}>
        <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(34px, 7vw, 48px)',
            fontWeight: 500, lineHeight: 1.1,
            color: 'var(--charcoal)', marginBottom: '12px',
          }}>
            Your results are coming soon
          </h1>
          <p style={{
            fontSize: '16px', color: 'var(--warm-gray)', lineHeight: 1.6, marginBottom: '32px',
          }}>
            We're still building the neighborhood matching. Here's what you told us so far.
          </p>

          {!loaded ? null : summary.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '15px', color: 'var(--warm-gray)', marginBottom: '20px' }}>
                No saved answers yet.
              </p>
              <button className="btn-primary" onClick={() => navigate('/new-to-ny')}>
                Take the quiz
              </button>
            </div>
          ) : (
            <>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {summary.map((row, i) => (
                  <div
                    key={row.id}
                    style={{
                      padding: '14px 18px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--sand-dark)',
                    }}
                  >
                    <div className="label" style={{ marginBottom: '4px' }}>{row.prompt}</div>
                    <div style={{ fontSize: '15px', color: 'var(--charcoal)', lineHeight: 1.5 }}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
                <button className="btn-secondary" onClick={() => navigate('/new-to-ny')}>
                  Retake the quiz
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
