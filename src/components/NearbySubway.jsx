import { useEffect, useState } from 'react'
import { TrainFront } from 'lucide-react'
import { nearbyStations, addWalkingTimes, formatDistance, ROUTE_COLORS, DARK_TEXT_ROUTES } from '../lib/subway'

export function RouteBullet({ route }) {
  const bg = ROUTE_COLORS[route] || '#808183'
  return (
    <span aria-label={`${route} train`} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '22px', height: '22px', borderRadius: '50%', background: bg,
      color: DARK_TEXT_ROUTES.has(route) ? '#2C2420' : 'white', fontSize: '12px', fontWeight: 700,
      fontFamily: 'var(--font-body)', flexShrink: 0,
    }}>{route}</span>
  )
}

// Nearby subway stations with walking time. Stations come from the database
// (MTA list); walking times from one Mapbox Matrix call, with a flat estimate
// when that is unavailable.
export default function NearbySubway({ lat, lng }) {
  const [stations, setStations] = useState(null)
  const [source, setSource] = useState('estimate')

  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    let cancelled = false
    nearbyStations(lng, lat, { limit: 5, maxM: 1600 })
      .then(async list => {
        if (cancelled) return
        setStations(list)
        const timed = await addWalkingTimes([lng, lat], list)
        if (cancelled) return
        setStations(timed)
        setSource(timed.some(s => s.walk_source === 'mapbox') ? 'mapbox' : 'estimate')
      })
      .catch(err => { console.error('Nearby stations failed:', err); if (!cancelled) setStations([]) })
    return () => { cancelled = true }
  }, [lat, lng])

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || stations === null) return null

  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <TrainFront size={15} color="var(--terracotta)" /> Subway nearby
      </p>
      {stations.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>No subway station within a 20-minute walk.</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {stations.map(s => (
            <li key={s.complex_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
              <span style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                {s.routes.map(r => <RouteBullet key={r} route={r} />)}
              </span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
              <span style={{ color: 'var(--warm-gray)', fontSize: '13px', flexShrink: 0 }}>
                {s.walk_min} min walk · {formatDistance(s.walk_m ?? s.distance_m)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p style={{ fontSize: '11px', color: 'var(--warm-gray)', margin: '8px 0 0', lineHeight: 1.5 }}>
        Stations: MTA, via NY Open Data. Walking times: {source === 'mapbox' ? 'Mapbox walking directions' : 'estimated from distance'}.
      </p>
    </div>
  )
}
