import { useEffect, useState } from 'react'
import { Footprints, Car, Search } from 'lucide-react'
import { findDestination, commuteTimes, loadDestination, saveDestination, formatMinutes } from '../lib/commute'
import { mapsEnabled } from '../lib/mapbox'

// "How long to get to work?" The renter types a destination; walking and
// driving times come from Mapbox. There is no transit time: Mapbox does not
// route public transit (open question for Joseph, NJ-4). The destination is
// remembered in this browser so every listing answers at once.
export default function CommuteCalculator({ lat, lng }) {
  const [text, setText] = useState('')
  const [dest, setDest] = useState(null)
  const [times, setTimes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = loadDestination()
    if (saved) { setDest(saved); setText(saved.label) }
  }, [])

  useEffect(() => {
    if (!dest || !Number.isFinite(lat) || !Number.isFinite(lng)) { setTimes(null); return }
    let cancelled = false
    setBusy(true)
    commuteTimes([lng, lat], [dest.lng, dest.lat])
      .then(t => { if (!cancelled) setTimes(t) })
      .catch(err => { console.error('Commute times failed:', err); if (!cancelled) setTimes({ walking: null, driving: null }) })
      .finally(() => { if (!cancelled) setBusy(false) })
    return () => { cancelled = true }
  }, [dest, lat, lng])

  async function lookUp(e) {
    e?.preventDefault?.()
    setError('')
    setBusy(true)
    try {
      const d = await findDestination(text)
      setDest(d)
      setText(d.label)
      saveDestination(d)
    } catch (err) {
      setError(err.message || 'Could not find that place')
    } finally {
      setBusy(false)
    }
  }

  function clear() {
    setDest(null); setTimes(null); setText(''); saveDestination(null)
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !mapsEnabled()) return null

  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Commute from here</p>
      <form onSubmit={lookUp} style={{ display: 'flex', gap: '8px' }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Work or school address"
          aria-label="Commute destination"
          style={{ padding: '10px 12px', fontSize: '14px', flex: 1 }}
        />
        <button type="submit" className="btn-primary" disabled={busy || !text.trim()} aria-label="Check commute"
          style={{ padding: '10px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', opacity: busy ? 0.7 : 1 }}>
          <Search size={14} /> Check
        </button>
      </form>
      {error && <p style={{ fontSize: '12px', color: 'var(--pass-red)', margin: '6px 0 0' }}>{error}</p>}
      {dest && (
        <div style={{ marginTop: '10px', background: 'var(--sand)', borderRadius: '10px', padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'baseline' }}>
            <span style={{ fontSize: '12px', color: 'var(--warm-gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>To {dest.label}</span>
            <button type="button" onClick={clear} className="btn-ghost" style={{ padding: '2px 6px', fontSize: '12px' }}>Change</button>
          </div>
          <div style={{ display: 'flex', gap: '18px', marginTop: '6px', fontSize: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Footprints size={15} color="var(--terracotta)" /> {busy && !times ? '…' : formatMinutes(times?.walking?.minutes)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Car size={15} color="var(--terracotta)" /> {busy && !times ? '…' : formatMinutes(times?.driving?.minutes)}
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--warm-gray)', margin: '6px 0 0', lineHeight: 1.5 }}>
            Walking and driving by Mapbox, typical traffic. Subway times are not available yet.
          </p>
        </div>
      )}
    </div>
  )
}
