import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { X, CalendarCheck } from 'lucide-react'

export default function RequestTour({ listing, onClose }) {
  const { user, profile } = useAuth()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [tourType, setTourType] = useState('in_person')
  const [times, setTimes] = useState([''])
  const [message, setMessage] = useState('')

  function updateTime(i, value) {
    setTimes(prev => prev.map((t, idx) => idx === i ? value : t))
  }

  function addTime() {
    if (times.length < 3) setTimes(prev => [...prev, ''])
  }

  function removeTime(i) {
    setTimes(prev => prev.filter((_, idx) => idx !== i))
  }

  async function submit() {
    setSending(true)
    try {
      const cleanTimes = times
        .filter(Boolean)
        .map(t => new Date(t).toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit',
        }))

      const { error: dbError } = await supabase.from('inquiries').insert({
        listing_id: listing.id,
        renter_id: user.id,
        poster_id: listing.poster_id,
        tour_type: tourType,
        preferred_times: cleanTimes,
        message: message.trim() || null,
      })
      if (dbError) throw dbError

      const resp = await fetch('/api/send-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingAddress: listing.address,
          listingPrice: listing.price,
          posterName: listing.profiles?.name,
          posterEmail: listing.profiles?.email,
          renterName: profile?.name,
          renterEmail: profile?.email,
          renterPhone: profile?.phone,
          tourType,
          times: cleanTimes,
          message: message.trim(),
        }),
      })
      if (!resp.ok) throw new Error('Email could not be sent')

      setSent(true)
    } catch (err) {
      console.error('Tour request failed:', err)
      toast.error(err.message || 'Could not send request')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300, padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)', borderRadius: '24px',
          width: '100%', maxWidth: '440px', maxHeight: '85dvh', overflowY: 'auto',
          padding: '24px',
        }}
      >
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>✅</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', marginBottom: '10px' }}>
              Request sent
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--warm-gray)', lineHeight: 1.6, marginBottom: '20px' }}>
              Your tour request for {listing.address} is on its way.
              Look for a confirmation email — the agent will reply to you directly.
            </p>
            <button className="btn-primary w-full" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, margin: 0 }}>
                Request a tour
              </h2>
              <button onClick={onClose} style={{
                background: 'var(--sand)', border: 'none', borderRadius: '50%',
                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--warm-gray)', marginBottom: '20px' }}>
              {listing.address} · ${listing.price?.toLocaleString()}/mo
            </p>

            <div style={{
              background: 'var(--sand)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px',
            }}>
              <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: 0, lineHeight: 1.5 }}>
                Sent as <strong>{profile?.name}</strong> ({profile?.email}
                {profile?.phone ? ', ' + profile.phone : ''}). The agent will reply to your email.
              </p>
            </div>

            <label className="label">Tour type</label>
            <div style={{ display: 'flex', gap: '10px', margin: '8px 0 20px' }}>
              {[
                { v: 'in_person', l: 'In person' },
                { v: 'video', l: 'Video chat' },
              ].map(({ v, l }) => (
                <button key={v} type="button" onClick={() => setTourType(v)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                    border: `2px solid ${tourType === v ? 'var(--terracotta)' : 'var(--sand-dark)'}`,
                    background: tourType === v ? 'rgba(180,74,54,0.08)' : 'var(--white)',
                    color: tourType === v ? 'var(--terracotta)' : 'var(--warm-gray)',
                    cursor: 'pointer',
                  }}>
                  {l}
                </button>
              ))}
            </div>

            <label className="label">Preferred times (optional, up to 3)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '8px 0 6px' }}>
              {times.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="datetime-local" value={t}
                    onChange={e => updateTime(i, e.target.value)} style={{ flex: 1 }} />
                  {times.length > 1 && (
                    <button type="button" onClick={() => removeTime(i)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex',
                    }}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {times.length < 3 && (
              <button type="button" onClick={addTime} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--terracotta)', fontSize: '13px', fontWeight: 600, padding: 0, marginBottom: '14px',
              }}>
                + Add another time
              </button>
            )}

            <label className="label">Message (optional)</label>
            <textarea rows={3} placeholder="Anything the agent should know…"
              value={message} onChange={e => setMessage(e.target.value)}
              style={{ marginTop: '8px', marginBottom: '20px', resize: 'vertical', width: '100%' }} />

            <button
              className="btn-primary w-full"
              onClick={submit}
              disabled={sending}
              style={{
                opacity: sending ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <CalendarCheck size={16} />
              {sending ? 'Sending…' : 'Send request'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
