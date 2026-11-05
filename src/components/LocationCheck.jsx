import { useEffect, useRef, useState } from 'react'
import { Loader, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import { geocodeAddress, neighborhoodForPoint, GeocodeError, formatAddressQuery } from '../lib/geocode'
import MapView from './MapView'
import { mapsEnabled, MAP_COLORS } from '../lib/mapbox'

// Address -> map point for the post/edit listing forms. Looks the typed
// address up with NYC GeoSearch (debounced), shows the matched address, the
// neighborhood it lands in and a small map, and hands the result up through
// onChange(geo | null). The neighborhood is read-only: it comes from the map.
// When the lookup fails the poster sees why and may type a neighborhood by
// hand (manualNeighborhood), so a bad address never blocks posting.
//
// geo = { lat, lng, bbl, bin, label, neighborhoodName, neighborhoodKind }

export default function LocationCheck({
  address, city, state, zip_code,
  value, onChange,
  manualNeighborhood, onManualNeighborhood,
}) {
  const [status, setStatus] = useState(value ? 'found' : 'idle')   // idle | looking | found | error
  const [message, setMessage] = useState('')
  const query = formatAddressQuery({ address, city, state, zip_code })
  const lastQuery = useRef(value ? query : null)
  const timer = useRef(null)
  const seq = useRef(0)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  async function lookup(q) {
    const mySeq = ++seq.current
    setStatus('looking')
    setMessage('')
    try {
      const g = await geocodeAddress({ address, city, state, zip_code })
      let hood = null
      try { hood = await neighborhoodForPoint(g.lng, g.lat) } catch (err) { console.error('Neighborhood lookup failed:', err) }
      if (mySeq !== seq.current) return
      const geo = {
        ...g,
        neighborhoodName: hood && hood.kind === 'neighborhood' ? hood.name : null,
        neighborhoodKind: hood ? hood.kind : null,
        neighborhoodLabel: hood ? hood.name : null,
      }
      lastQuery.current = q
      onChangeRef.current?.(geo)
      setStatus('found')
    } catch (err) {
      if (mySeq !== seq.current) return
      lastQuery.current = q
      onChangeRef.current?.(null)
      setStatus('error')
      setMessage(err instanceof GeocodeError ? err.message : 'The address lookup failed. Try again in a moment.')
    }
  }

  // Debounced auto-lookup whenever the typed address changes.
  useEffect(() => {
    clearTimeout(timer.current)
    if (!String(address || '').trim() || String(address || '').trim().length < 4) {
      if (value) onChangeRef.current?.(null)
      setStatus('idle')
      return
    }
    if (query === lastQuery.current) return
    timer.current = setTimeout(() => lookup(query), 900)
    return () => clearTimeout(timer.current)
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  const box = (bg, border) => ({
    background: bg, border: `1px solid ${border}`, borderRadius: '10px', padding: '12px 14px',
    display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', lineHeight: 1.5,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div>
        <label className="label">Neighborhood</label>
        <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: '2px 0 0', lineHeight: 1.5 }}>
          Set from the map once the address is found. Posters can't change it.
        </p>
      </div>

      {status === 'idle' && (
        <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>Type the street address above to place this listing on the map.</p>
      )}

      {status === 'looking' && (
        <div style={box('var(--sand)', 'var(--sand-dark)')}>
          <Loader size={16} style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0, marginTop: '2px' }} />
          <span>Finding that address…</span>
        </div>
      )}

      {status === 'found' && value && (
        <>
          <div style={box('rgba(76,175,125,0.08)', 'rgba(76,175,125,0.35)')}>
            <CheckCircle2 size={16} color="var(--like-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--charcoal)' }}>{value.label || 'Address found'}</div>
              <div style={{ color: 'var(--charcoal-soft)', marginTop: '2px' }}>
                {value.neighborhoodName
                  ? <>Neighborhood: <strong>{value.neighborhoodName}</strong></>
                  : value.neighborhoodLabel
                    ? <>This point is in <strong>{value.neighborhoodLabel}</strong>, not inside a residential neighborhood, so no neighborhood is set.</>
                    : 'This point is outside every neighborhood we know, so no neighborhood is set.'}
                {value.bbl ? <span style={{ color: 'var(--warm-gray)' }}> · BBL {value.bbl}</span> : null}
              </div>
            </div>
            <button type="button" onClick={() => lookup(query)} aria-label="Look the address up again" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex', padding: '2px' }}>
              <RefreshCw size={15} />
            </button>
          </div>
          {mapsEnabled() && (
            <MapView
              key={`${value.lng},${value.lat}`}
              center={[value.lng, value.lat]}
              zoom={14.5}
              interactive={false}
              style={{ height: '150px', borderRadius: '10px', overflow: 'hidden' }}
              ariaLabel="Map showing the listing location"
              onReady={(map, mapboxgl) => {
                new mapboxgl.Marker({ color: MAP_COLORS.terracotta }).setLngLat([value.lng, value.lat]).addTo(map)
              }}
            />
          )}
        </>
      )}

      {status === 'error' && (
        <>
          <div style={box('rgba(224,85,85,0.07)', 'rgba(224,85,85,0.35)')}>
            <AlertTriangle size={16} color="var(--pass-red)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--pass-red)' }}>Address not found on the map</div>
              <div style={{ color: 'var(--charcoal-soft)', marginTop: '2px' }}>{message}</div>
            </div>
            <button type="button" onClick={() => lookup(query)} aria-label="Try the lookup again" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex', padding: '2px' }}>
              <RefreshCw size={15} />
            </button>
          </div>
          <div>
            <label className="label">Neighborhood (typed, since the map lookup failed)</label>
            <input placeholder="Park Slope" value={manualNeighborhood || ''}
              onChange={e => onManualNeighborhood?.(e.target.value)} style={{ marginTop: '6px' }} />
            <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: '6px 0 0', lineHeight: 1.5 }}>
              The listing will post without a map pin. Fix the address later and it will be placed automatically.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
