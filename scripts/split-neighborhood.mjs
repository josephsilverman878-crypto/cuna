#!/usr/bin/env node
// Split one Cuna neighborhood area along a street, the way Joseph names them
// ("split Bed-Stuy at Tompkins Ave"). Writes a SQL file for the Supabase SQL
// editor; it does NOT touch the database itself (this machine has no
// database access beyond the anon key, which can only read).
//
//   node scripts/split-neighborhood.mjs \
//     --slug bedford-stuyvesant-west --street "Tompkins Ave" \
//     --names "Bed-Stuy West,Bed-Stuy East" [--out cuna-security/splits/bed-stuy.sql]
//
// What it does
//   1. Reads the area (name, borough, bbox) from the live neighborhoods table
//      through the public neighborhoods_geojson RPC (anon key from .env.local).
//   2. Fetches every OpenStreetMap way with that street name inside the
//      area's bounding box (Overpass API; abbreviations like Ave/St/Blvd are
//      expanded). Several Overpass mirrors are tried.
//   3. Emits SQL that, in ONE transaction: merges those segments into a line,
//      clips it to the area (plus a small margin), splits the area with it,
//      groups the pieces into the two sides of the street, inserts the two
//      new areas (source cuna_custom, note "split of ... at ..."), moves the
//      area's listings onto the new sides (the placement trigger does it),
//      and finally removes the original row. The last step rewrites existing
//      data, so the SQL says so at the top and the whole file runs only on
//      Joseph's explicit go.
//
// Names: the first name goes to the WEST side (the side whose middle is
// further west); when the street runs east-west, to the SOUTH side.
// If the street does not cross the area from edge to edge, the SQL stops with
// a message and changes nothing.

import fs from 'fs'
import path from 'path'

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true'])
  return acc
}, []))
if (!args.slug || !args.street || !args.names) {
  console.error('usage: node scripts/split-neighborhood.mjs --slug <slug> --street "<street name>" --names "<west or south name>,<east or north name>" [--out file.sql]')
  process.exit(1)
}
const [nameA, nameB] = args.names.split(',').map(s => s.trim())
if (!nameA || !nameB) { console.error('--names needs two names separated by a comma'); process.exit(1) }

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.env.local'), 'utf8').split('\n')
  .filter(l => l.includes('=') && !l.trim().startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const SUPABASE_URL = env.VITE_SUPABASE_URL, ANON = env.VITE_SUPABASE_ANON_KEY
if (!SUPABASE_URL || !ANON) { console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing from .env.local'); process.exit(1) }

const ABBREV = { ave: 'Avenue', av: 'Avenue', st: 'Street', blvd: 'Boulevard', pkwy: 'Parkway', pl: 'Place', rd: 'Road', dr: 'Drive', ln: 'Lane', ct: 'Court', expy: 'Expressway', hwy: 'Highway', ter: 'Terrace', sq: 'Square', pky: 'Parkway' }
function expandStreet(s) {
  return s.trim().split(/\s+/).map((w, i, arr) => {
    const k = w.replace(/\.$/, '').toLowerCase()
    return i === arr.length - 1 && ABBREV[k] ? ABBREV[k] : w
  }).join(' ')
}
const streetName = expandStreet(args.street)
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '')

// 1. The area
const fc = await (await fetch(`${SUPABASE_URL}/rest/v1/rpc/neighborhoods_geojson`, {
  method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json' }, body: '{}',
})).json()
const feature = (fc.features || []).find(f => f.properties.slug === args.slug)
if (!feature) { console.error(`no area with slug "${args.slug}"`); process.exit(1) }
const area = feature.properties
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
const walk = c => Array.isArray(c[0]) ? c.forEach(walk) : (minX = Math.min(minX, c[0]), minY = Math.min(minY, c[1]), maxX = Math.max(maxX, c[0]), maxY = Math.max(maxY, c[1]))
walk(feature.geometry.coordinates)
const pad = 0.004
const bbox = [minY - pad, minX - pad, maxY + pad, maxX + pad]   // Overpass: south,west,north,east
console.log(`area: ${area.name} [${area.slug}] ${area.borough} ${area.area_km2} km2; bbox ${bbox.map(n => n.toFixed(4)).join(',')}`)

// 2. The street from OpenStreetMap
const q = `[out:json][timeout:60];way["highway"]["name"~"^${streetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$",i](${bbox.join(',')});out geom;`
let osm = null
const errors = []
const mirrors = ['https://overpass-api.de/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.osm.ch/api/interpreter', 'https://overpass.private.coffee/api/interpreter']
for (let attempt = 0; attempt < 3 && !osm; attempt++) {
  for (const url of mirrors) {
    try {
      const r = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'cuna-split-neighborhood/1.0' } })
      if (r.ok) { osm = await r.json(); break }
      errors.push(url + ' -> ' + r.status)
    } catch (e) { errors.push(url + ' -> ' + e.message) }
  }
  if (!osm) { console.log(`Overpass busy (attempt ${attempt + 1}); waiting 20 s`); await new Promise(res => setTimeout(res, 20000)) }
}
if (!osm) { console.error('Overpass failed on every mirror:\n  ' + errors.join('\n  ')); process.exit(1) }
const ways = osm.elements.filter(w => w.type === 'way' && w.geometry && w.geometry.length > 1)
if (!ways.length) { console.error(`no OpenStreetMap way named "${streetName}" inside the area's box; check the spelling`); process.exit(1) }
console.log(`street: "${streetName}" -> ${ways.length} OSM segments`)
const multiline = { type: 'MultiLineString', coordinates: ways.map(w => w.geometry.map(p => [p.lon, p.lat])) }

// 3. The SQL
const q1 = s => "'" + String(s).replace(/'/g, "''") + "'"
const today = new Date().toISOString().slice(0, 10)
const slugA = slugify(nameA), slugB = slugify(nameB)
const sql = `-- split-${area.slug}-at-${slugify(streetName)}.sql  (generated ${today} by scripts/split-neighborhood.mjs)
-- Splits the area "${area.name}" [${area.slug}] along ${streetName} into
--   "${nameA}" [${slugA}]  (west, or south if the street runs east-west)
--   "${nameB}" [${slugB}]  (east, or north)
-- REWRITES EXISTING DATA: the original row is removed at the end and its
-- listings move to the new sides. Run only on Joseph's explicit go, in a NEW
-- SQL editor tab, as ONE script. Everything happens in one transaction; if
-- the street does not cross the area edge to edge, it stops and changes nothing.
begin;
set local search_path = public, extensions;

create temp table t_split on commit drop as
with a as (
  select id, name, borough, geom from public.neighborhoods where slug = ${q1(area.slug)}
), street as (
  select ST_LineMerge(ST_Intersection(
           ST_SetSRID(ST_GeomFromGeoJSON(${q1(JSON.stringify(multiline))}), 4326),
           ST_Buffer(a.geom, 0.0015))) as line
    from a
), parts as (
  select (ST_Dump(ST_Split(a.geom, s.line))).geom as g, a.id, a.name, a.borough, s.line
    from a, street s
), sided as (
  -- which side of the street each piece sits on: compare the piece's centre
  -- with the line's overall direction (cross product sign)
  select p.*,
         sign((ST_X(ST_EndPoint(ST_LineMerge(p.line))) - ST_X(ST_StartPoint(ST_LineMerge(p.line)))) *
              (ST_Y(ST_Centroid(p.g)) - ST_Y(ST_StartPoint(ST_LineMerge(p.line)))) -
              (ST_Y(ST_EndPoint(ST_LineMerge(p.line))) - ST_Y(ST_StartPoint(ST_LineMerge(p.line)))) *
              (ST_X(ST_Centroid(p.g)) - ST_X(ST_StartPoint(ST_LineMerge(p.line))))) as side
    from parts p
)
select id, name, borough, side, ST_Multi(ST_Union(g)) as geom, ST_X(ST_Centroid(ST_Union(g))) as cx, ST_Y(ST_Centroid(ST_Union(g))) as cy
  from sided group by id, name, borough, side;

do $chk$
declare n int; msg text;
begin
  select count(*) into n from t_split;
  if n <> 2 then
    msg := format('STOP: the street splits the area into %s side(s), not 2. The street must cross the area edge to edge. Nothing changed.', n);
    raise exception '%', msg;
  end if;
end
$chk$;

-- Name assignment: first name to the west side, or the south side when the
-- two centres differ more in latitude than in longitude.
create temp table t_named on commit drop as
with o as (select *, row_number() over () as rn from t_split),
     d as (select abs(max(cx) - min(cx)) as dx, abs(max(cy) - min(cy)) as dy from t_split)
select o.id as orig_id, o.name as orig_name, o.borough, o.geom,
       case when (select dx >= dy from d) then (case when o.cx = (select min(cx) from t_split) then ${q1(nameA)} else ${q1(nameB)} end)
            else (case when o.cy = (select min(cy) from t_split) then ${q1(nameA)} else ${q1(nameB)} end) end as new_name
  from o;

insert into public.neighborhoods (slug, name, borough, kind, source, source_id, source_note, geom, geom_simple, area_km2)
select case when new_name = ${q1(nameA)} then ${q1(slugA)} else ${q1(slugB)} end,
       new_name, borough, 'neighborhood', 'cuna_custom',
       case when new_name = ${q1(nameA)} then ${q1(slugA)} else ${q1(slugB)} end,
       format('split of "%s" at ${streetName.replace(/%/g, '%%')} on ${today}', orig_name),
       geom, ST_Multi(ST_SimplifyPreserveTopology(geom, 0.00008)), round((ST_Area(geom::geography) / 1e6)::numeric, 3)
  from t_named;

-- Listings in the old area are re-placed by the trigger (lat = lat re-fires it).
alter table public.listings disable trigger listings_record_event;
update public.listings set neighborhood_id = null, lat = lat
 where neighborhood_id = (select orig_id from t_named limit 1);
alter table public.listings enable trigger listings_record_event;

-- Saved searches that named the old area now name both halves.
update public.saved_searches
   set neighborhood_ids = array_remove(neighborhood_ids, (select orig_id from t_named limit 1))
                          || array(select id from public.neighborhoods where slug in (${q1(slugA)}, ${q1(slugB)}))
 where (select orig_id from t_named limit 1) = any(neighborhood_ids);

-- The original row goes last (its listings and searches have moved).
delete from public.neighborhoods where id = (select orig_id from t_named limit 1);

commit;

select slug, name, area_km2, source_note from public.neighborhoods where slug in (${q1(slugA)}, ${q1(slugB)}) order by slug;
`
const out = args.out || path.join(root, 'cuna-security', 'splits', `split-${area.slug}-at-${slugify(streetName)}.sql`)
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, sql)
console.log('wrote', out, `(${sql.length} bytes). Review it, then paste into a NEW Supabase SQL editor tab on Joseph's go.`)
