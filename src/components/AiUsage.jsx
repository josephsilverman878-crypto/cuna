import { useEffect, useState } from 'react'
import { AI_ENABLED, getUsage, subscribeUsage, loadUsage } from '../lib/ai'

// The small "40% of today's AI used" bar shown with every AI surface.
// A percentage only: people never see what the assistant costs. At 80% a
// gentle note; at 100% the friendly "used today's AI" line. The allowance
// resets at midnight New York time.
export default function AiUsage({ style }) {
  const [usage, setUsage] = useState(getUsage())
  useEffect(() => {
    const off = subscribeUsage(setUsage)
    loadUsage()
    return off
  }, [])
  if (!AI_ENABLED || !usage) return null

  const { percent, level, paused } = usage
  const note = paused
    ? "Cuna's assistant is paused for today. It will be back at midnight."
    : level === 'full'
      ? "You've used today's AI. It resets at midnight."
      : level === 'near'
        ? "You're close to today's AI allowance. It resets at midnight."
        : null
  const color = level === 'full' || paused ? 'var(--charcoal-soft)' : 'var(--terracotta)'

  return (
    <div style={{ ...style }} role="status" aria-live="polite">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div aria-hidden="true" style={{ flex: 1, maxWidth: '120px', height: '4px', borderRadius: '2px', background: 'var(--sand-dark)', overflow: 'hidden' }}>
          <div style={{ width: `${percent}%`, height: '100%', background: color, transition: 'width 0.4s' }} />
        </div>
        <span style={{ fontSize: '11px', color: 'var(--warm-gray)', whiteSpace: 'nowrap' }}>{percent}% of today's AI used</span>
      </div>
      {note && <p style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--charcoal-soft)', margin: '6px 0 0' }}>{note}</p>}
    </div>
  )
}
