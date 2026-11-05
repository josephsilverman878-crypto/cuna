import { useEffect, useRef, useState } from 'react'
import { Pencil, Check, X, Eraser } from 'lucide-react'
import MapView from './MapView'
import { MAP_COLORS, ringToPolygon, bboxOf } from '../lib/mapbox'
import { loadAreaShapes } from '../lib/areas'
import { shortMoney } from '../lib/listingTypes'

// The feed's map: every Cuna area as a tappable shape, one pin per matching
// listing, and a draw-your-own-area mode. Selection state lives in the feed;
// this component only draws it and reports taps.
//
// props
//   points        [{ id, lat, lng, price }]  pins, synced to the list
//   selectedIds   Set<string>                 selected area ids
//   onToggleArea  (id) => void
//   area          GeoJSON Polygon | null      the drawn area
//   onAreaChange  (polygon | null) => void
//   onClear       () => void                  clears areas + drawn polygon
//   onOpenListing (id) => void
//   height        CSS height

const SRC_AREAS = 'cuna-areas'
const SRC_PINS = 'cuna-pins'
const SRC_DRAW = 'cuna-draw'
const SRC_AREA = 'cuna-area'
const EMPTY_FC = { type: 'FeatureCollection', features: [] }

function pinsToGeoJSON(points) {
  return {
    type: 'FeatureCollection',
    features: (points || [])
      .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .map(p => ({
        type: 'Feature',
        id: p.id,
        properties: { id: p.id, price: p.price, label: p.price ? (Number(p.price) < 10000 ? '$' + Number(p.price).toLocaleString() : shortMoney(p.price)) : '' },
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      })),
  }
}

function draftToGeoJSON(pts) {
  const features = pts.map(c => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: c } }))
  if (pts.length >= 2) features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: pts } })
  if (pts.length >= 3) {
    features.push({ type: 'Feature', properties: { closing: true }, geometry: { type: 'LineString', coordinates: [pts[pts.length - 1], pts[0]] } })
  }
  return { type: 'FeatureCollection', features }
}

function areaToGeoJSON(area) {
  return area ? { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: area }] } : EMPTY_FC
}

export default function FeedMap({ points, selectedIds, onToggleArea, area, onAreaChange, onClear, onOpenListing, height = '62vh' }) {
  const mapRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [draft, setDraft] = useState([])
  const [areasError, setAreasError] = useState(false)
  const drawingRef = useRef(false)
  const propsRef = useRef({})
  propsRef.current = { onToggleArea, onOpenListing, selectedIds }
  const fittedRef = useRef(false)

  function handleReady(map) {
    mapRef.current = map
    map.addSource(SRC_AREAS, { type: 'geojson', data: EMPTY_FC })
    map.addSource(SRC_AREA, { type: 'geojson', data: areaToGeoJSON(area) })
    map.addSource(SRC_PINS, { type: 'geojson', data: pinsToGeoJSON(points) })
    map.addSource(SRC_DRAW, { type: 'geojson', data: EMPTY_FC })

    // Parks, cemeteries, airports and special areas: drawn, never selectable.
    map.addLayer({
      id: 'areas-other-fill', type: 'fill', source: SRC_AREAS,
      filter: ['!=', ['get', 'kind'], 'neighborhood'],
      paint: {
        'fill-color': ['match', ['get', 'kind'], ['park', 'cemetery'], MAP_COLORS.green, MAP_COLORS.sandDark],
        'fill-opacity': 0.55,
      },
    })
    map.addLayer({
      id: 'areas-fill', type: 'fill', source: SRC_AREAS,
      filter: ['==', ['get', 'kind'], 'neighborhood'],
      paint: { 'fill-color': MAP_COLORS.terracotta, 'fill-opacity': 0.03 },
    })
    map.addLayer({
      id: 'areas-selected-fill', type: 'fill', source: SRC_AREAS,
      filter: ['in', ['get', 'id'], ['literal', []]],
      paint: { 'fill-color': MAP_COLORS.terracotta, 'fill-opacity': 0.32 },
    })
    map.addLayer({
      id: 'areas-line', type: 'line', source: SRC_AREAS,
      paint: {
        'line-color': ['case', ['get', 'custom'], MAP_COLORS.clay, MAP_COLORS.warmGray],
        'line-width': ['case', ['get', 'custom'], 1.4, 0.8],
        'line-opacity': 0.8,
      },
    })
    map.addLayer({
      id: 'areas-selected-line', type: 'line', source: SRC_AREAS,
      filter: ['in', ['get', 'id'], ['literal', []]],
      paint: { 'line-color': MAP_COLORS.terracottaDark, 'line-width': 2.2 },
    })
    map.addLayer({
      id: 'areas-label', type: 'symbol', source: SRC_AREAS, minzoom: 11.5,
      filter: ['==', ['get', 'kind'], 'neighborhood'],
      layout: {
        'text-field': ['get', 'name'], 'text-size': 11,
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
        'text-max-width': 8, 'text-padding': 4,
      },
      paint: { 'text-color': MAP_COLORS.charcoalSoft, 'text-halo-color': MAP_COLORS.white, 'text-halo-width': 1.2 },
    })
    // Drawn area
    map.addLayer({ id: 'area-fill', type: 'fill', source: SRC_AREA, paint: { 'fill-color': MAP_COLORS.terracotta, 'fill-opacity': 0.18 } })
    map.addLayer({ id: 'area-line', type: 'line', source: SRC_AREA, paint: { 'line-color': MAP_COLORS.terracottaDark, 'line-width': 2, 'line-dasharray': [2, 1.5] } })
    // Draft while drawing
    map.addLayer({
      id: 'draw-line', type: 'line', source: SRC_DRAW,
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: {
        'line-color': MAP_COLORS.terracottaDark, 'line-width': 2,
        'line-dasharray': ['case', ['boolean', ['get', 'closing'], false], ['literal', [1, 2]], ['literal', [1, 0]]],
      },
    })
    map.addLayer({
      id: 'draw-points', type: 'circle', source: SRC_DRAW,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: { 'circle-radius': 6, 'circle-color': MAP_COLORS.white, 'circle-stroke-color': MAP_COLORS.terracottaDark, 'circle-stroke-width': 2 },
    })
    // Pins
    map.addLayer({
      id: 'pins', type: 'circle', source: SRC_PINS,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 14, 9],
        'circle-color': MAP_COLORS.terracotta, 'circle-stroke-color': MAP_COLORS.white, 'circle-stroke-width': 2,
      },
    })
    map.addLayer({
      id: 'pins-label', type: 'symbol', source: SRC_PINS, minzoom: 13,
      layout: {
        'text-field': ['get', 'label'], 'text-size': 11, 'text-offset': [0, -1.4],
        'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'], 'text-allow-overlap': false,
      },
      paint: { 'text-color': MAP_COLORS.charcoal, 'text-halo-color': MAP_COLORS.white, 'text-halo-width': 1.4 },
    })

    map.on('click', e => {
      if (drawingRef.current) {
        setDraft(prev => [...prev, [e.lngLat.lng, e.lngLat.lat]])
        return
      }
      const pin = map.queryRenderedFeatures(e.point, { layers: ['pins'] })[0]
      if (pin) { propsRef.current.onOpenListing?.(pin.properties.id); return }
      const hood = map.queryRenderedFeatures(e.point, { layers: ['areas-fill'] })[0]
      if (hood) propsRef.current.onToggleArea?.(hood.properties.id)
    })
    for (const layer of ['pins', 'areas-fill']) {
      map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = '' })
    }

    loadAreaShapes()
      .then(({ geojson }) => { if (map.getSource(SRC_AREAS)) map.getSource(SRC_AREAS).setData(geojson) })
      .catch(err => { console.error('Areas could not load:', err); setAreasError(true) })

    setReady(true)
  }

  // Pins follow the list.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map?.getSource(SRC_PINS)) return
    map.getSource(SRC_PINS).setData(pinsToGeoJSON(points))
    if (!fittedRef.current && points?.length) {
      const b = bboxOf(points.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng)).map(p => [p.lng, p.lat]))
      if (b) {
        map.fitBounds(b, { padding: 48, maxZoom: 14, duration: 0 })
        fittedRef.current = true
      }
    }
  }, [points, ready])

  // Selection highlight.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map?.getLayer('areas-selected-fill')) return
    const ids = [...(selectedIds || [])]
    const filter = ['in', ['get', 'id'], ['literal', ids]]
    map.setFilter('areas-selected-fill', filter)
    map.setFilter('areas-selected-line', filter)
  }, [selectedIds, ready])

  // Drawn area and the in-progress draft.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map?.getSource(SRC_AREA)) return
    map.getSource(SRC_AREA).setData(areaToGeoJSON(area))
  }, [area, ready])
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map?.getSource(SRC_DRAW)) return
    map.getSource(SRC_DRAW).setData(drawing ? draftToGeoJSON(draft) : EMPTY_FC)
  }, [draft, drawing, ready])

  function startDrawing() {
    drawingRef.current = true
    setDrawing(true)
    setDraft([])
  }
  function cancelDrawing() {
    drawingRef.current = false
    setDrawing(false)
    setDraft([])
  }
  function finishDrawing() {
    const polygon = ringToPolygon(draft)
    drawingRef.current = false
    setDrawing(false)
    setDraft([])
    if (polygon) onAreaChange?.(polygon)
  }
  function undoPoint() {
    setDraft(prev => prev.slice(0, -1))
  }

  const hasSelection = (selectedIds && selectedIds.size > 0) || Boolean(area)
  const btn = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
    background: 'var(--white)', color: 'var(--charcoal)', border: '1px solid var(--sand-dark)',
    boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
  }
  const btnPrimary = { ...btn, background: 'var(--terracotta)', color: 'white', border: '1px solid var(--terracotta)' }

  return (
    <MapView onReady={handleReady} style={{ height, borderRadius: 'var(--radius)', overflow: 'hidden' }} ariaLabel="Map of listings and neighborhoods">
      <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', justifyContent: 'space-between', gap: '8px', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', pointerEvents: 'auto' }}>
          {!drawing ? (
            <>
              <button type="button" onClick={startDrawing} style={btn} aria-label="Draw your own area">
                <Pencil size={14} /> Draw area
              </button>
              {hasSelection && (
                <button type="button" onClick={onClear} style={btn} aria-label="Clear selected areas">
                  <Eraser size={14} /> Clear
                </button>
              )}
            </>
          ) : (
            <>
              <button type="button" onClick={finishDrawing} disabled={draft.length < 3} style={{ ...btnPrimary, opacity: draft.length < 3 ? 0.5 : 1 }} aria-label="Finish drawing">
                <Check size={14} /> Done{draft.length ? ` (${draft.length})` : ''}
              </button>
              {draft.length > 0 && (
                <button type="button" onClick={undoPoint} style={btn} aria-label="Remove last corner">Undo</button>
              )}
              <button type="button" onClick={cancelDrawing} style={btn} aria-label="Cancel drawing">
                <X size={14} /> Cancel
              </button>
            </>
          )}
        </div>
      </div>
      {drawing && (
        <div style={{
          position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(44,36,32,0.85)', color: 'white', fontSize: '12px', padding: '6px 12px',
          borderRadius: '14px', pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          {draft.length < 3 ? 'Tap the map to add corners (at least 3)' : 'Add more corners or tap Done'}
        </div>
      )}
      {!drawing && !hasSelection && (
        <div style={{
          position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(253,251,248,0.92)', color: 'var(--charcoal-soft)', fontSize: '12px', padding: '6px 12px',
          borderRadius: '14px', pointerEvents: 'none', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-sm)',
        }}>
          Tap a neighborhood to search inside it
        </div>
      )}
      {areasError && (
        <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', background: 'rgba(224,85,85,0.9)', color: 'white', fontSize: '12px', padding: '6px 10px', borderRadius: '10px', textAlign: 'center' }}>
          Neighborhood shapes could not load. Pins and drawing still work.
        </div>
      )}
    </MapView>
  )
}
