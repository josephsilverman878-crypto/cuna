import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { X, MessageCircle } from 'lucide-react'

// "Ask a question" -- the email twin of RequestTour, for any listing status.
// Stored as an inquiry with kind = 'question' (same table, same RLS). The row
// is inserted FIRST so the database rate limit (34-saved-alerts.sql) gates the
// email; then api/send-inquiry.js mails the poster and copies the renter.
// Only the renter's name and email travel with a question -- none of the
// privacy-toggle details that a tour request can carry.
export default function AskQuestion({ listing, onClose }) {
  const { user, profile } = useAuth()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit() {
    const text = message.trim()
    if (text.length < 5) { toast.error('Write your question first'); return }
    if (!listing?.profiles?.email) { toast.error('The agent for this listing cannot be reached right now'); return }

    setSending(true)
    try {
      const { error: dbError } = await supabase.from('inquiries').insert({
        listing_id: listing.id,
        renter_id: user.id,
        poster_id: listing.poster_id,
        kind: 'question',
        message: text,
        preferred_times: [],
      })
      if (dbError) throw new Error(dbError.message || 'Could not save your question')

      const resp = await fetch('/api/send-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'question',
          listingAddress: listing.address,
          listingPrice: listing.price,
          listingUrl: window.location.origin + '/listing/' + listing.id,
          posterName: listing.profiles?.name,
          posterEmail: listing.profiles?.email,
          renterName: profile?.name,
          renterEmail: profile?.email,
          message: text,
        }),
      })
      if (!resp.ok) throw new Error('Your question was saved for the agent, but the email could not be sent')
      setSent(true)
    } catch (err) {
      console.error('Ask a question failed:', err)
      toast.error(err.message || 'Could not send your question')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--white)', borderRadius: '24px', width: '100%', maxWidth: '440px', maxHeight: '85dvh', overflowY: 'auto', padding: '24px' }}
      >
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>✅</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', marginBottom: '10px' }}>Question sent</h2>
            <p style={{ fontSize: '14px', color: 'var(--warm-gray)', lineHeight: 1.6, marginBottom: '20px' }}>
              Your question about {listing.address} is on its way. You'll get a copy by email, and the agent can reply to you directly.
            </p>
            <button className="btn-primary w-full" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, margin: 0 }}>Ask a question</h2>
              <button onClick={onClose} aria-label="Close" style={{
                background: 'var(--sand)', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
              }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--warm-gray)', marginBottom: '16px' }}>
              {listing.address} · ${listing.price?.toLocaleString()}/mo
            </p>
            <div style={{ background: 'var(--sand)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: 0, lineHeight: 1.5 }}>
                Sent as <strong>{profile?.name}</strong> ({profile?.email}). Only your name and email go with a
                question — nothing from your sharing toggles. The agent replies to your email.
              </p>
            </div>
            <label className="label" htmlFor="ask-question-text">Your question</label>
            <textarea
              id="ask-question-text"
              rows={4}
              placeholder="Is heat included? Is there a washer in the unit?"
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={{ marginTop: '8px', marginBottom: '20px', resize: 'vertical', width: '100%' }}
            />
            <button
              className="btn-primary w-full"
              onClick={submit}
              disabled={sending}
              style={{ opacity: sending ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <MessageCircle size={16} />
              {sending ? 'Sending…' : 'Send question'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
