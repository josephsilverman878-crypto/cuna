import { Sparkles } from 'lucide-react'
import { AI_LABEL } from '../lib/ai'
import AiUsage from './AiUsage'

// The line shown near every AI surface, with the person's usage bar under
// it. One component so the wording cannot drift between pages. A page that
// shows several AI tools at once passes usage={false} on all but one.
export default function AiLabel({ style, usage = true }) {
  return (
    <div style={{ ...style }}>
      <p style={{
        display: 'flex', alignItems: 'flex-start', gap: '8px', margin: 0,
        fontSize: '12px', lineHeight: 1.5, color: 'var(--warm-gray)',
      }}>
        <Sparkles size={14} strokeWidth={2} color="var(--terracotta)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
        <span>{AI_LABEL}</span>
      </p>
      {usage && <AiUsage style={{ marginTop: '8px', paddingLeft: '22px' }} />}
    </div>
  )
}
