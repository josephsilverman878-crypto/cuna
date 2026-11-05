// Mapbox GL JS, loaded on demand. The library is about 500 KB gzipped, so it
// is imported only by screens that actually show a map (loadMapbox below);
// the rest of the app never downloads it.
//
// VITE_MAPBOX_TOKEN is a Mapbox PUBLIC token (it starts with "pk."). Public
// tokens are designed to ship in the browser, so the VITE_ prefix is correct
// here, unlike the server-side secrets CLAUDE.md warns about. Limit what it
// can do in the Mapbox dashboard: URL restrictions to hellocuna.com and the
// Vercel preview domains, and only the "styles:read, fonts:read, tiles:read"
// scopes a browser needs.

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

export function mapsEnabled() {
  return Boolean(MAPBOX_TOKEN)
}

// Lower Manhattan / Brooklyn as the default view; the whole city as the limit.
export const NYC_CENTER = [-73.955, 40.72]
export const NYC_BOUNDS = [[-74.3, 40.47], [-73.65, 40.94]]
export const BASE_STYLE = 'mapbox://styles/mapbox/light-v11'

// Mirrors src/index.css :root. Water and park tones are chosen to sit inside
// the warm palette rather than the cool grays of the stock Light style.
export const MAP_COLORS = {
  sand: '#F5F0E8',
  sandDark: '#EDE6D6',
  terracotta: '#C4714A',
  terracottaDark: '#A85A35',
  clay: '#8B6355',
  charcoal: '#2C2420',
  charcoalSoft: '#4A3F3A',
  warmGray: '#9B8E88',
  warmGrayLight: '#C5BBB7',
  white: '#FDFBF8',
  water: '#D3DEDD',
  green: '#DCE3CD',
  likeGreen: '#4CAF7D',
}

let loader = null

// Resolves to the mapboxgl module with the access token already set. Both the
// script and its stylesheet are code-split by Vite.
export function loadMapbox() {
  if (!loader) {
    loader = Promise.all([import('mapbox-gl'), import('mapbox-gl/dist/mapbox-gl.css')])
      .then(([mod]) => {
        const mapboxgl = mod.default
        mapboxgl.accessToken = MAPBOX_TOKEN
        return mapboxgl
      })
  }
  return loader
}

const GREEN_CLASSES = ['park', 'grass', 'cemetery', 'pitch', 'golf_course', 'wood', 'scrub', 'recreation_ground', 'garden', 'playground']

// Recolours the Mapbox Light style into Cuna's palette. Layers are matched by
// type and source layer rather than by exact id, so a Mapbox style revision
// does not silently drop the theme; anything unmatched keeps its stock look.
// Point-of-interest labels are hidden: they clutter a phone-sized map and
// nothing on a Cuna map should hint at who lives where.
export function applyCunaPalette(map) {
  const style = map.getStyle()
  if (!style?.layers) return
  for (const layer of style.layers) {
    const { id, type } = layer
    const src = layer['source-layer'] || ''
    try {
      if (type === 'background') {
        map.setPaintProperty(id, 'background-color', MAP_COLORS.sand)
        continue
      }
      if (type === 'symbol') {
        if (/poi|transit|airport/.test(id)) {
          map.setLayoutProperty(id, 'visibility', 'none')
          continue
        }
        map.setPaintProperty(id, 'text-color', /road|street|path|waterway|natural/.test(id) ? MAP_COLORS.warmGray : MAP_COLORS.charcoalSoft)
        map.setPaintProperty(id, 'text-halo-color', MAP_COLORS.white)
        continue
      }
      if (src === 'water' || src === 'waterway' || /water/.test(id)) {
        if (type === 'fill') map.setPaintProperty(id, 'fill-color', MAP_COLORS.water)
        if (type === 'line') map.setPaintProperty(id, 'line-color', MAP_COLORS.water)
        continue
      }
      if (src === 'landuse' || src === 'landuse_overlay' || src === 'landcover') {
        if (type === 'fill') {
          map.setPaintProperty(id, 'fill-color', ['match', ['get', 'class'], GREEN_CLASSES, MAP_COLORS.green, MAP_COLORS.sand])
        }
        continue
      }
      if (/national-park|park/.test(id) && type === 'fill') {
        map.setPaintProperty(id, 'fill-color', MAP_COLORS.green)
        continue
      }
      if (src === 'building' || /building/.test(id)) {
        if (type === 'fill') map.setPaintProperty(id, 'fill-color', MAP_COLORS.sandDark)
        if (type === 'fill-extrusion') map.setPaintProperty(id, 'fill-extrusion-color', MAP_COLORS.sandDark)
        if (type === 'line') map.setPaintProperty(id, 'line-color', MAP_COLORS.sandDark)
        continue
      }
      if (src === 'road' || /^(road|bridge|tunnel)/.test(id)) {
        if (type === 'line') map.setPaintProperty(id, 'line-color', /case|casing|outline/.test(id) ? MAP_COLORS.sandDark : MAP_COLORS.white)
        if (type === 'fill') map.setPaintProperty(id, 'fill-color', MAP_COLORS.white)
        continue
      }
      if (src === 'admin' || /admin|boundary/.test(id)) {
        if (type === 'line') map.setPaintProperty(id, 'line-color', MAP_COLORS.warmGrayLight)
        continue
      }
      if (src === 'structure' || src === 'aeroway') {
        if (type === 'fill') map.setPaintProperty(id, 'fill-color', MAP_COLORS.sandDark)
        if (type === 'line') map.setPaintProperty(id, 'line-color', MAP_COLORS.sandDark)
      }
    } catch {
      // A paint property this layer does not have; leave the layer as it is.
    }
  }
}

// GeoJSON helpers shared by the feed map and the listing page.

// [[lng, lat], ...] closed ring -> Polygon feature. Returns null for fewer
// than 3 distinct points.
export function ringToPolygon(points) {
  const pts = (points || []).filter(p => Array.isArray(p) && p.length === 2)
  if (pts.length < 3) return null
  const ring = [...pts]
  const [fx, fy] = ring[0]
  const [lx, ly] = ring[ring.length - 1]
  if (fx !== lx || fy !== ly) ring.push([fx, fy])
  return { type: 'Polygon', coordinates: [ring] }
}

// Bounding box [[minLng, minLat], [maxLng, maxLat]] of a list of [lng, lat].
export function bboxOf(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of points) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return Number.isFinite(minX) ? [[minX, minY], [maxX, maxY]] : null
}
