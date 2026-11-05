import { ExternalLink } from 'lucide-react'
import MapView from './MapView'
import { mapsEnabled, MAP_COLORS } from '../lib/mapbox'
import { supabase } from '../lib/supabase'

// Location block on the listing page: a pin on the listing and the outline
// of the neighborhood it sits in (neighborhood_shape RPC). Non-interactive
// so the page scrolls normally; "Open in Maps" hands off to the phone's map.
export default function ListingMap({ lat, lng, neighborhoodId, neighborhoodName, address }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

  function onReady(map, mapboxgl) {
    new mapboxgl.Marker({ color: MAP_COLORS.terracotta }).setLngLat([lng, lat]).addTo(map)
    if (!neighborhoodId) return
    supabase.rpc('neighborhood_shape', { p_id: neighborhoodId }).then(({ data, error }) => {
      if (error || !data?.geometry || !map.getStyle()) return
      map.addSource('hood', { type: 'geojson', data })
      map.addLayer({ id: 'hood-fill', type: 'fill', source: 'hood', paint: { 'fill-color': MAP_COLORS.terracotta, 'fill-opacity': 0.1 } })
      map.addLayer({ id: 'hood-line', type: 'line', source: 'hood', paint: { 'line-color': MAP_COLORS.terracottaDark, 'line-width': 1.8 } })
      try {
        const coords = data.geometry.type === 'Polygon' ? data.geometry.coordinates.flat(1) : data.geometry.coordinates.flat(2)
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const [x, y] of coords) { if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y }
        map.fitBounds([[minX, minY], [maxX, maxY]], { padding: 24, duration: 0, maxZoom: 14.5 })
      } catch { /* keep the point-centred view */ }
    })
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Location</p>
      {mapsEnabled() ? (
        <MapView
          center={[lng, lat]} zoom={14} interactive={false} onReady={onReady}
          style={{ height: '220px', borderRadius: '12px', overflow: 'hidden' }}
          ariaLabel={`Map showing ${address || 'the listing'}`}
        />
      ) : null}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>
          {neighborhoodName ? `Outline: ${neighborhoodName}` : 'Exact building shown; outline unavailable'}
        </span>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--terracotta)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          Open in Maps <ExternalLink size={13} />
        </a>
      </div>
    </div>
  )
}
