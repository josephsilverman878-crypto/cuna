import { useEffect, useRef, useState } from 'react'
import { loadMapbox, mapsEnabled, applyCunaPalette, BASE_STYLE, NYC_CENTER, NYC_BOUNDS } from '../lib/mapbox'

// A Mapbox GL map in Cuna's palette. Creates the map once, recolours it, hands
// it to onReady(map, mapboxgl) after the style has loaded, and destroys it on
// unmount. Anything passed as children is rendered on top of the map
// (buttons, legends), positioned by the caller.
//
// With no token, or when WebGL is unavailable, it renders a plain sand box
// with a short message instead, so a page never breaks because of the map.
export default function MapView({
  center = NYC_CENTER,
  zoom = 11,
  bounds = null,
  maxBounds = NYC_BOUNDS,
  interactive = true,
  onReady,
  onError,
  style,
  children,
  ariaLabel = 'Map',
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const onReadyRef = useRef(onReady)
  const onErrorRef = useRef(onError)
  const [failed, setFailed] = useState(!mapsEnabled())
  onReadyRef.current = onReady
  onErrorRef.current = onError

  useEffect(() => {
    if (!mapsEnabled() || !containerRef.current) return
    let cancelled = false
    let map = null

    loadMapbox().then(mapboxgl => {
      if (cancelled || !containerRef.current) return
      try {
        map = new mapboxgl.Map({
          container: containerRef.current,
          style: BASE_STYLE,
          center,
          zoom,
          maxBounds,
          interactive,
          attributionControl: true,
          cooperativeGestures: false,
          // Mapbox's own logo stays (required by its terms); the compass and
          // pitch controls are noise on a phone.
          pitchWithRotate: false,
          dragRotate: false,
          touchPitch: false,
        })
      } catch (err) {
        console.error('Map could not start:', err)
        setFailed(true)
        onErrorRef.current?.(err)
        return
      }
      mapRef.current = map
      map.touchZoomRotate.disableRotation()
      map.on('error', e => {
        // Tile and style errors are logged, not surfaced: the base map keeps working.
        if (e?.error) console.error('Map error:', e.error.message || e.error)
      })
      map.once('load', () => {
        if (cancelled) return
        applyCunaPalette(map)
        if (bounds) map.fitBounds(bounds, { padding: 24, duration: 0 })
        onReadyRef.current?.(map, mapboxgl)
      })
    }).catch(err => {
      console.error('Mapbox could not load:', err)
      if (!cancelled) {
        setFailed(true)
        onErrorRef.current?.(err)
      }
    })

    return () => {
      cancelled = true
      if (map) {
        try { map.remove() } catch { /* already gone */ }
      }
      mapRef.current = null
    }
    // The map is created once; later changes to center/zoom are the caller's
    // job through the map instance handed to onReady.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (failed) {
    return (
      <div
        role="img"
        aria-label="Map unavailable"
        style={{
          background: 'var(--sand-dark)', color: 'var(--warm-gray)', fontSize: '13px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          padding: '16px', ...style,
        }}
      >
        Map unavailable on this device
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', background: 'var(--sand-dark)', ...style }}>
      <div ref={containerRef} aria-label={ariaLabel} role="region" style={{ position: 'absolute', inset: 0 }} />
      {children}
    </div>
  )
}
