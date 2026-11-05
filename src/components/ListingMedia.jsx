import { useState } from 'react'
import { Play, Box, LayoutTemplate } from 'lucide-react'

// Floor plans (images), a video tour (YouTube/Vimeo) and a 3D tour
// (Matterport) on the listing page. Nothing is hosted here: videos and 3D
// tours are embedded from their links, and the embed loads only after a tap
// so the page stays light.

export function embedUrl(kind, url) {
  if (!url) return null
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\.|^m\./, '')
    if (kind === 'video') {
      if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1).split('/')[0]}`
      if (host === 'youtube.com') {
        const id = u.searchParams.get('v') || (u.pathname.startsWith('/shorts/') || u.pathname.startsWith('/embed/') ? u.pathname.split('/')[2] : null)
        return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
      }
      if (host === 'vimeo.com' || host === 'player.vimeo.com') {
        const id = u.pathname.split('/').filter(Boolean).pop()
        return /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null
      }
      return null
    }
    if (kind === 'tour') {
      if (host === 'matterport.com' || host === 'my.matterport.com') {
        const m = u.searchParams.get('m')
        return m ? `https://my.matterport.com/show/?m=${encodeURIComponent(m)}&play=1` : null
      }
      return null
    }
  } catch { return null }
  return null
}

function Embed({ kind, url, label, icon: Icon }) {
  const [open, setOpen] = useState(false)
  const src = embedUrl(kind, url)
  if (!src) return null
  return (
    <div style={{ marginBottom: '12px' }}>
      {open ? (
        <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: '12px', overflow: 'hidden', background: 'var(--charcoal)' }}>
          <iframe
            src={src}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking; fullscreen"
            allowFullScreen
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} style={{
          width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--sand-dark)',
          background: 'var(--sand)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '14px', fontWeight: 600, color: 'var(--charcoal)', textAlign: 'left',
        }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--terracotta)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={16} />
          </span>
          <span>{label}<span style={{ display: 'block', fontSize: '12px', fontWeight: 400, color: 'var(--warm-gray)' }}>Tap to load (opens the player on this page)</span></span>
        </button>
      )}
    </div>
  )
}

export default function ListingMedia({ floorPlans = [], videoUrl, tour3dUrl }) {
  const plans = Array.isArray(floorPlans) ? floorPlans.filter(Boolean) : []
  const [plan, setPlan] = useState(null)
  if (!plans.length && !embedUrl('video', videoUrl) && !embedUrl('tour', tour3dUrl)) return null

  return (
    <div style={{ marginBottom: '20px' }}>
      {plans.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LayoutTemplate size={15} color="var(--terracotta)" /> Floor plan{plans.length > 1 ? 's' : ''}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: plans.length > 1 ? 'repeat(2, 1fr)' : '1fr', gap: '8px' }}>
            {plans.map((url, i) => (
              <button key={url} type="button" onClick={() => setPlan(url)} aria-label={`Open floor plan ${i + 1}`}
                style={{ padding: 0, border: '1px solid var(--sand-dark)', borderRadius: '10px', overflow: 'hidden', background: 'var(--white)', cursor: 'zoom-in' }}>
                <img src={url} alt={`Floor plan ${i + 1}`} loading="lazy" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'contain', display: 'block', background: 'var(--white)' }} />
              </button>
            ))}
          </div>
        </div>
      )}
      <Embed kind="video" url={videoUrl} label="Video tour" icon={Play} />
      <Embed kind="tour" url={tour3dUrl} label="3D walkthrough" icon={Box} />

      {plan && (
        <div onClick={() => setPlan(null)} role="dialog" aria-label="Floor plan" style={{
          position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(44,36,32,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', cursor: 'zoom-out',
        }}>
          <img src={plan} alt="Floor plan" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', background: 'white', borderRadius: '8px' }} />
        </div>
      )}
    </div>
  )
}
