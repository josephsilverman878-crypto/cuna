import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import {
  STORAGE_KEY,
  getVisibleQuestions,
  getOptions,
  getHelper,
  isAnswered,
  pruneAnswers,
} from '../lib/quizQuestions'

// Every localStorage touch is wrapped: Safari private mode and blocked-cookie
// settings throw on access, and the quiz has to keep working without it.
function loadSaved() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.answers) return null
    return parsed
  } catch {
    return null
  }
}

function save(answers, step) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      step,
      answers,
    }))
  } catch {
    // Storage unavailable — the quiz still runs, it just won't resume later.
  }
}

function clearSaved() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to do; in-memory state is still correct.
  }
}

const INTRO = -1

export default function NewToNY() {
  const navigate = useNavigate()
  const [step, setStep] = useState(INTRO)
  const [answers, setAnswers] = useState({})
  const [saved, setSaved] = useState(null)
  const advanceTimer = useRef(null)

  useEffect(() => {
    const found = loadSaved()
    if (found && Object.keys(found.answers || {}).length > 0) setSaved(found)
  }, [])

  // Auto-advance runs on a timer so the tapped option is visibly selected first.
  useEffect(() => () => clearTimeout(advanceTimer.current), [])

  const visible = getVisibleQuestions(answers)
  const question = step >= 0 ? visible[step] : null

  function applyAnswer(questionId, value) {
    let next = { ...answers, [questionId]: value }
    // Budget options are generated from tenure, so a changed tenure invalidates
    // whatever budget band was picked under the old one.
    if (questionId === 'tenure' && answers.tenure && answers.tenure !== value) {
      delete next.budget
    }
    next = pruneAnswers(next)
    setAnswers(next)
    save(next, step)
    return next
  }

  function advance(nextAnswers) {
    const nextVisible = getVisibleQuestions(nextAnswers)
    if (step >= nextVisible.length - 1) {
      save(nextAnswers, nextVisible.length)
      navigate('/new-to-ny/results')
    } else {
      setStep(step + 1)
    }
  }

  function handleSingle(q, option) {
    const value = option.value ? { id: option.id, ...option.value } : option.id
    const next = applyAnswer(q.id, value)
    clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(() => advance(next), 160)
  }

  function toggleMulti(q, option) {
    const current = Array.isArray(answers[q.id]) ? answers[q.id] : []
    const options = getOptions(q, answers)
    let next
    if (current.includes(option.id)) {
      next = current.filter(id => id !== option.id)
    } else if (option.exclusive) {
      next = [option.id]
    } else {
      // Picking a real option clears any "not sure" / "no preference" choice.
      const exclusiveIds = options.filter(o => o.exclusive).map(o => o.id)
      next = [...current.filter(id => !exclusiveIds.includes(id)), option.id]
    }
    applyAnswer(q.id, next)
  }

  function setMatrixRow(q, rowId, optionId) {
    const current = answers[q.id] && typeof answers[q.id] === 'object' ? answers[q.id] : {}
    applyAnswer(q.id, { ...current, [rowId]: optionId })
  }

  function goBack() {
    clearTimeout(advanceTimer.current)
    setStep(s => (s <= 0 ? INTRO : s - 1))
  }

  function startFresh() {
    clearSaved()
    setSaved(null)
    setAnswers({})
    setStep(0)
  }

  function resume() {
    const restored = pruneAnswers(saved.answers || {})
    const restoredVisible = getVisibleQuestions(restored)
    // Land on the first unanswered question, or the last one if all are done.
    const firstGap = restoredVisible.findIndex(q => !isAnswered(q, restored))
    setAnswers(restored)
    setStep(firstGap === -1 ? restoredVisible.length - 1 : firstGap)
    setSaved(null)
  }

  const selected = question ? answers[question.id] : undefined
  const canContinue = question ? isAnswered(question, answers) : false

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(160deg, #F5F0E8 0%, #EDE6D6 100%)',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px', gap: '12px',
      }}>
        <Link to="/" style={{
          fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 600,
          color: 'var(--terracotta)',
        }}>
          cuna
        </Link>
        {question && (
          <span style={{ fontSize: '13px', color: 'var(--warm-gray)' }}>
            {answers.tenure ? `${step + 1} of ${visible.length}` : `Question ${step + 1}`}
          </span>
        )}
      </header>

      {question && (
        <div style={{ padding: '0 24px' }}>
          <div style={{
            height: '4px', borderRadius: '2px', background: 'var(--sand-dark)', overflow: 'hidden',
          }}>
            <div style={{
              width: `${((step + 1) / visible.length) * 100}%`,
              height: '100%', background: 'var(--terracotta)', transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '32px 24px 48px',
      }}>
        <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>

          {step === INTRO ? (
            <div style={{ textAlign: 'center' }}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(34px, 7.5vw, 54px)',
                fontWeight: 500, lineHeight: 1.08,
                color: 'var(--charcoal)', marginBottom: '20px',
              }}>
                Looking in New York? Find your neighborhood.
              </h1>
              <p style={{
                fontSize: '17px', color: 'var(--warm-gray)', lineHeight: 1.6,
                maxWidth: '460px', margin: '0 auto 36px', fontWeight: 300,
              }}>
                Rent or buy, new to the city or not. Tell us how you want to live and we'll show you the neighborhoods that fit.
              </p>

              {saved ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                  <button
                    className="btn-primary"
                    style={{ fontSize: '17px', padding: '16px 40px' }}
                    onClick={resume}
                  >
                    Continue where you left off
                  </button>
                  <button className="btn-ghost" onClick={startFresh}>
                    Start over
                  </button>
                </div>
              ) : (
                <button
                  className="btn-primary"
                  style={{ fontSize: '17px', padding: '16px 40px' }}
                  onClick={() => setStep(0)}
                >
                  Start
                </button>
              )}
            </div>
          ) : (
            <>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 6vw, 38px)',
                fontWeight: 500, lineHeight: 1.15,
                color: 'var(--charcoal)', marginBottom: '8px',
              }}>
                {question.prompt}
              </h2>
              {getHelper(question, answers) && (
                <p style={{ fontSize: '15px', color: 'var(--warm-gray)', marginBottom: '24px', lineHeight: 1.5 }}>
                  {getHelper(question, answers)}
                </p>
              )}
              <div style={{ height: getHelper(question, answers) ? 0 : '24px' }} />

              {question.type === 'matrix' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {question.rows.map(row => (
                    <div key={row.id}>
                      <div style={{
                        fontSize: '15px', fontWeight: 500, color: 'var(--charcoal)', marginBottom: '8px',
                      }}>
                        {row.label}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {question.options.map(option => {
                          const on = (answers[question.id] || {})[row.id] === option.id
                          return (
                            <button
                              key={option.id}
                              aria-pressed={on}
                              onClick={() => setMatrixRow(question, row.id, option.id)}
                              style={{
                                flex: 1, padding: '10px 4px', borderRadius: '10px',
                                fontSize: '13px', fontWeight: on ? 600 : 400,
                                border: `1.5px solid ${on ? 'var(--terracotta)' : 'var(--sand-dark)'}`,
                                background: on ? 'rgba(196,113,74,0.08)' : 'var(--white)',
                                color: on ? 'var(--terracotta)' : 'var(--charcoal-soft)',
                              }}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {getOptions(question, answers).map(option => {
                    const on = question.type === 'multi'
                      ? Array.isArray(selected) && selected.includes(option.id)
                      : (selected && typeof selected === 'object' ? selected.id : selected) === option.id
                    return (
                      <button
                        key={option.id}
                        aria-pressed={on}
                        onClick={() =>
                          question.type === 'multi'
                            ? toggleMulti(question, option)
                            : handleSingle(question, option)
                        }
                        style={{
                          width: '100%', textAlign: 'left',
                          padding: '16px 18px', borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${on ? 'var(--terracotta)' : 'var(--sand-dark)'}`,
                          background: on ? 'rgba(196,113,74,0.08)' : 'var(--white)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <span style={{
                          display: 'block', fontSize: '16px', fontWeight: on ? 600 : 400,
                          color: on ? 'var(--terracotta)' : 'var(--charcoal)',
                        }}>
                          {option.label}
                        </span>
                        {option.helper && (
                          <span style={{
                            display: 'block', marginTop: '4px',
                            fontSize: '13px', lineHeight: 1.45, color: 'var(--warm-gray)',
                          }}>
                            {option.helper}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '12px', marginTop: '28px',
              }}>
                <button
                  className="btn-ghost"
                  onClick={goBack}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '10px' }}
                >
                  <ChevronLeft size={16} />
                  Back
                </button>

                {question.type !== 'single' && (
                  <button
                    className="btn-primary"
                    onClick={() => advance(answers)}
                    disabled={!canContinue}
                    style={{ opacity: canContinue ? 1 : 0.5, cursor: canContinue ? 'pointer' : 'default' }}
                  >
                    {step === visible.length - 1 ? 'See neighborhoods' : 'Next'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
