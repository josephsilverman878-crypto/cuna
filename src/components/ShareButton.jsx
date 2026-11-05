import { Share2 } from 'lucide-react'
import toast from 'react-hot-toast'

// Native share sheet where the browser has one (phones); copies the link
// everywhere else.
export default function ShareButton({ title, text, url, style, label = 'Share' }) {
  async function share() {
    const shareUrl = url || window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl })
        return
      } catch (err) {
        if (err?.name === 'AbortError') return   // the user closed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied')
    } catch {
      window.prompt('Copy this link', shareUrl)
    }
  }
  return (
    <button type="button" onClick={share} aria-label={label} style={{
      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--charcoal)', display: 'flex',
      alignItems: 'center', gap: '6px', padding: '6px', fontSize: '13px', fontWeight: 600, ...style,
    }}>
      <Share2 size={18} />
    </button>
  )
}
