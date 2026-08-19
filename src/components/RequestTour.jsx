import { useState, useEffect } from 'react'
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
  // Parallel to `times`. True where the input holds a partial datetime that the
  // browser reports as an empty value — see updateTime.
  const [timeErrors, setTimeErrors] = useState([false])
  const [message, setMessage] = useState('')
  const [renterProfile, setRenterProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Load the renter's privacy toggles up front so the preview below shows
  // exactly what will be shared — the same object is used to build the payload.
  useEffect(() => {
    let cancelled = false
    async function loadRenterProfile() {
      const { data, error } = await supabase
        .from('renter_profiles')
        .select('move_in_date, has_pets, pet_details, credit_score_range, show_phone, show_move_in, show_pets, show_credit')
        .eq('id', user.id)
        .maybeSingle()
      // TEMP DEBUG — remove once privacy toggles are confirmed working
      console.log('[cuna-debug] renter_profiles fetch', {
        userId: user.id,
        error,
        rowReturned: !!data,
        row: data,
      })
      if (error) console.error('Renter profile fetch failed:', error)
      if (!cancelled) {
        setRenterProfile(data || null)
        setLoadingProfile(false)
      }
    }
    loadRenterProfile()
    return () => { cancelled = true }
  }, [user.id])

  // Only fields whose matching toggle is ON. Absent toggles share nothing.
  // If the profile row is missing entirely, nothing optional is shared.
  // Toggles are compared with === true on purpose: a NULL column or any
  // non-boolean value must fail closed rather than fall through a truthy check.
  function buildSharedDetails() {
    const rp = renterProfile
    const shared = {}
    if (!rp) return shared
    if (rp.show_phone === true && profile?.phone) shared.renterPhone = profile.phone
    if (rp.show_move_in === true && rp.move_in_date) shared.moveInDate = rp.move_in_date
    if (rp.show_pets === true) {
      shared.hasPets = !!rp.has_pets
      if (rp.has_pets && rp.pet_details) shared.petDetails = rp.pet_details
    }
    if (rp.show_credit === true && rp.credit_score_range) shared.creditScoreRange = rp.credit_score_range
    return shared
  }

  const shared = buildSharedDetails()

  // TEMP DEBUG — remove once privacy toggles are confirmed working
  console.log('[cuna-debug] shared object built', {
    renterProfileLoaded: !!renterProfile,
    show_phone: renterProfile?.show_phone,
    authProfileHasPhone: !!profile?.phone,
    shared,
    sharedKeys: Object.keys(shared),
  })

  function formatCredit(range) {
    return range ? range.replace('_', '-') : ''
  }

  // Human-readable list of the optional items being shared, for the preview.
  const sharedLabels = []
  if (shared.renterPhone) sharedLabels.push('Phone: ' + shared.renterPhone)
  if (shared.moveInDate) sharedLabels.push('Move-in: ' + new Date(shared.moveInDate).toLocaleDateString())
  if (shared.hasPets !== undefined) {
    sharedLabels.push(shared.hasPets
      ? 'Pets: has pets' + (shared.petDetails ? ` (${shared.petDetails})` : '')
      : 'Pets: no pets')
  }
  if (shared.creditScoreRange) sharedLabels.push('Credit: ' + formatCredit(shared.creditScoreRange))

  // A datetime-local input reports value === '' until EVERY segment is filled —
  // date, hour, minute and AM/PM. While it is partially filled it reports
  // validity.badInput, which is the only way to tell "user typed nothing" apart
  // from "user typed something incomplete". Both look like '' otherwise, and
  // .filter(Boolean) used to drop the second case silently.
  function updateTime(i, e) {
    const { value, validity } = e.target
    setTimes(prev => prev.map((t, idx) => idx === i ? value : t))
    setTimeErrors(prev => prev.map((bad, idx) => idx === i ? validity?.badInput === true : bad))
  }

  function addTime() {
    if (times.length >= 3) return
    setTimes(prev => [...prev, ''])
    setTimeErrors(prev => [...prev, false])
  }

  function removeTime(i) {
    setTimes(prev => prev.filter((_, idx) => idx !== i))
    setTimeErrors(prev => prev.filter((_, idx) => idx !== i))
  }

  async function submit() {
    // Refuse to send rather than quietly dropping a half-entered time and
    // telling the agent no times were offered.
    if (timeErrors.some(Boolean)) {
      toast.error('One of your preferred times is incomplete')
      return
    }
    setSending(true)
    try {
      const cleanTimes = times
        .filter(Boolean)
        .map(t => new Date(t).toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit',
        }))

      const emailPayload = {
        listingAddress: listing.address,
        listingPrice: listing.price,
        posterName: listing.profiles?.name,
        posterEmail: listing.profiles?.email,
        renterName: profile?.name,
        renterEmail: profile?.email,
        listingUrl: window.location.origin + '/listing/' + listing.id,
        tourType,
        times: cleanTimes,
        message: message.trim(),
        // TEMP DEBUG — identifies which client build sent this request, so the
        // server log can prove whether an old tab/bundle is still in play.
        clientBuild: 'esc-v2',
        // Only toggled-on fields; renterPhone is included here or not at all.
        ...shared,
      }

      // TEMP DEBUG — remove once privacy toggles are confirmed working
      console.log('[cuna-debug] POST /api/send-inquiry payload', {
        payload: emailPayload,
        payloadKeys: Object.keys(emailPayload),
        hasRenterPhoneKey: 'renterPhone' in emailPayload,
      })

      const resp = await fetch('/api/send-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      })
     if (!resp.ok) throw new Error('Email could not be sent')

      // Snapshot what was actually shared at send time, so the poster's
      // dashboard reflects this moment rather than the renter's current settings.
      const insertPayload = {
        listing_id: listing.id,
        renter_id: user.id,
        poster_id: listing.poster_id,
        tour_type: tourType,
        preferred_times: cleanTimes,
        message: message.trim() || null,
        shared_phone: shared.renterPhone || null,
        shared_move_in_date: shared.moveInDate || null,
        shared_has_pets: shared.hasPets !== undefined ? shared.hasPets : null,
        shared_pet_details: shared.petDetails || null,
        shared_credit_score_range: shared.creditScoreRange || null,
      }

      // TEMP DEBUG — remove once privacy toggles are confirmed working
      console.log('[cuna-debug] inquiries insert payload', insertPayload)

      const { data: insertedRows, error: dbError } = await supabase
        .from('inquiries').insert(insertPayload).select()

      // TEMP DEBUG — shows whether the row we think we wrote is what came back
      console.log('[cuna-debug] inquiries insert result', {
        error: dbError,
        returnedRow: insertedRows?.[0] || null,
      })

      if (dbError) console.error('Inquiry row failed after email sent:', dbError)

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
                Sent as <strong>{profile?.name}</strong> ({profile?.email}).
                The agent will reply to your email.
              </p>

              {loadingProfile ? (
                <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: '10px 0 0' }}>
                  Checking what you're sharing…
                </p>
              ) : (
                <>
                  <p style={{
                    fontSize: '11px', fontWeight: 700, color: 'var(--charcoal)',
                    textTransform: 'uppercase', letterSpacing: '0.5px', margin: '12px 0 6px',
                  }}>
                    Also shared with this agent
                  </p>
                  {sharedLabels.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
                      {sharedLabels.map(label => (
                        <li key={label} style={{ fontSize: '12px', color: 'var(--charcoal-soft)', lineHeight: 1.6 }}>
                          {label}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: 0, lineHeight: 1.5 }}>
                      Nothing else — only your name and email.
                    </p>
                  )}
                  <p style={{ fontSize: '11px', color: 'var(--warm-gray)', margin: '8px 0 0', lineHeight: 1.5 }}>
                    Controlled by the sharing toggles in your profile.
                  </p>
                </>
              )}
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
                <div key={i}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="datetime-local" value={t}
                      onChange={e => updateTime(i, e)}
                      onBlur={e => updateTime(i, e)}
                      style={{ flex: 1, border: timeErrors[i] ? '1.5px solid var(--pass-red)' : undefined }} />
                    {times.length > 1 && (
                      <button type="button" onClick={() => removeTime(i)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex',
                      }}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {timeErrors[i] && (
                    <p style={{ fontSize: '12px', color: 'var(--pass-red)', margin: '6px 0 0' }}>
                      Incomplete — fill in the date and the full time, including AM/PM.
                    </p>
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
