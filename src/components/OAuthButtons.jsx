import { useState } from 'react'
import toast from 'react-hot-toast'
import { enabledProviders, PROVIDERS, signInWithProvider } from '../lib/oauth'

// Renders nothing unless VITE_OAUTH_PROVIDERS names a provider.
export default function OAuthButtons({ next = '/' }) {
  const providers = enabledProviders()
  const [busy, setBusy] = useState(null)
  if (!providers.length) return null

  async function go(p) {
    setBusy(p)
    try { await signInWithProvider(p, next) }
    catch (err) { toast.error(err.message || 'Sign in failed'); setBusy(null) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--warm-gray)', fontSize: '12px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--sand-dark)' }} />or<div style={{ flex: 1, height: '1px', background: 'var(--sand-dark)' }} />
      </div>
      {providers.map(p => (
        <button key={p} type="button" onClick={() => go(p)} disabled={busy === p} className="btn-secondary" style={{
          width: '100%', padding: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: busy === p ? 0.7 : 1,
        }}>
          {p === 'google' ? <GoogleMark /> : <AppleMark />}
          {busy === p ? 'Opening…' : PROVIDERS[p].label}
        </button>
      ))}
      <p style={{ fontSize: '11px', color: 'var(--warm-gray)', margin: 0, lineHeight: 1.5, textAlign: 'center' }}>
        New accounts still choose a role and accept the Terms and Privacy Policy on the next screen.
      </p>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.8c2.3-2.1 3.6-5.2 3.6-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-3c-1.1.7-2.5 1.2-4.2 1.2-3.2 0-5.9-2.2-6.9-5.1H1.1v3.1C3.1 21.3 7.2 24 12 24z" />
      <path fill="#FBBC05" d="M5.1 14.2c-.5-1.5-.5-3 0-4.5V6.6H1.1c-1.5 3-1.5 6.6 0 9.6l4-3z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.2 0 3.1 2.7 1.1 6.6l4 3.1c1-2.9 3.7-5 6.9-5z" />
    </svg>
  )
}

function AppleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.8 1.3 10.3.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.4-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.8-1.1-2.8-4.2zM13.9 4.9c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3-1.5z" />
    </svg>
  )
}
