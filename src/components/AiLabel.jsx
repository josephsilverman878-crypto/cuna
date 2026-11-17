import { Sparkles } from 'lucide-react'
import { AI_LABEL } from '../lib/ai'

// The line shown near every AI surface. One component so the wording
// cannot drift between pages.
export default function AiLabel({ style }) {
  return (
    <p style={{
      display: 'flex', alignItems: 'flex-start', gap: '8px', margin: 0,
      fontSize: '12px', lineHeight: 1.5, color: 'var(--warm-gray)', ...style,
    }}>
      <Sparkles size={14} strokeWidth={2} color="var(--terracotta)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
      <span>{AI_LABEL}</span>
    </p>
  )
}
