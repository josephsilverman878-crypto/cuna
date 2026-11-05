#!/usr/bin/env node
// Pre-renders one static HTML page per neighborhood into dist/ after
// `vite build`, so search engines get real text for /neighborhoods/:slug
// from a Vite SPA. Each page carries the SPA's script and stylesheet tags
// copied from dist/index.html, so a visitor gets the live React page (the
// router takes over on load) while a crawler reads the static content.
//
// Also writes dist/neighborhoods/index.html and dist/sitemap.xml.
//
// Data: public.neighborhoods + neighborhoods_geojson() (Cuna / NYC DCP NTA
// 2020), public.subway_stations, public listings, NYC DOE school locations,
// NYS DOH facilities, NYC DOF Rolling Sales medians. Everything is fetched
// ONCE and assigned to neighborhoods by point-in-polygon here; about ten
// requests in all. Any failure is logged and the build still succeeds:
// pages are written with whatever loaded, or skipped entirely if the
// neighborhoods themselves cannot be read.
//
// Env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (Vercel build env, or
// .env.local when run by hand). Set PRERENDER=0 to skip.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import {
  geometryContains, shapeSchool, shapeHospital, groupStations, listingSummary, dofRowsFor, fetchDofMedians,
  sinceTwelveMonths, pageTitle, pageDescription, GROUP_LABELS, BOROUGH_DIGIT, MIN_RECORDS,
} from '../src/lib/neighborhoodPage.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = resolve(ROOT, 'dist')
const SITE = process.env.PUBLIC_BASE_URL || 'https://hellocuna.com'

function loadEnv() {
  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) return
  const p = resolve(ROOT, '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const money = n => '$' + Math.round(n).toLocaleString('en-US')

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${url.split('?')[0]} ${res.status}`)
  return res.json()
}

async function safe(label, fn, fallback) {
  try { return await fn() } catch (err) { console.warn(`[prerender] ${label} failed: ${err.message}`); return fallback }
}

function renderPage(template, model) {
  const { hood, listings, stations, schools, hospitals, dof, summary } = model
  const title = pageTitle(hood)
  const description = pageDescription(model)
  const url = `${SITE}/neighborhoods/${hood.slug}`
  const head = `<title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="website" />
    <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Place', name: `${hood.name}, ${hood.borough}`, url, description, containedInPlace: { '@type': 'City', name: 'New York' } })}</script>`
  const li = items => items.map(i => `<li>${i}</li>`).join('')
  const body = `
    <main style="max-width:680px;margin:0 auto;padding:24px;font-family:'DM Sans',system-ui,sans-serif;color:#2C2420;background:#F5F0E8">
      <p style="font-size:12px;color:#9B8E88"><a href="/" style="color:#C4714A;text-decoration:none;font-weight:600">cuna</a> · <a href="/neighborhoods" style="color:#9B8E88">${esc(hood.borough)} neighborhoods</a></p>
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:34px;margin:0">${esc(hood.name)}, ${esc(hood.borough)}</h1>
      <p>${esc(description)}</p>
      <h2>On Cuna now (${summary.count})</h2>
      ${summary.count === 0 ? `<p>Nothing in ${esc(hood.name)} is listed on Cuna right now. <a href="/feed">Save a search</a> and you will hear first.</p>` : `<p>${summary.rent_median ? `Median asking rent ${money(summary.rent_median)}/mo (${summary.rent} rentals). ` : ''}${summary.sale_median ? `Median asking price ${money(summary.sale_median)} (${summary.sale} for sale).` : ''}</p>
      <ul>${li(listings.slice(0, 12).map(l => `<a href="/listing/${l.id}">${esc(l.address)}</a> · ${l.listing_type === 'sale' ? money(l.price) : money(l.price) + '/mo'} · ${l.bedrooms} bed · ${l.bathrooms} bath`))}</ul>`}
      <p style="font-size:12px;color:#9B8E88">Source: Cuna listings marked Active or In contract.</p>
      <h2>Subway</h2>
      ${stations.length ? `<ul>${li(stations.map(s => `${esc(s.name)} (${s.routes.join(', ')})${s.ada ? ' · accessible' : ''}`))}</ul>` : `<p>No subway station inside ${esc(hood.name)}; the nearest ones show on each listing page.</p>`}
      <p style="font-size:12px;color:#9B8E88">Source: MTA subway stations (NYC Open Data 39hk-dx4f), stations inside the neighborhood boundary.</p>
      <h2>Public schools</h2>
      ${schools.length ? `<ul>${li(schools.map(s => `${esc(s.name)}${s.grades ? ' · grades ' + esc(s.grades) : ''}${s.address ? ' · ' + esc(s.address) : ''}`))}</ul>` : '<p>No public school building inside this boundary.</p>'}
      <p style="font-size:12px;color:#9B8E88">Source: NYC Department of Education school locations (NYC Open Data wg9x-4ke6). Names, grades and addresses only.</p>
      <h2>Hospitals</h2>
      ${hospitals.length ? `<ul>${li(hospitals.map(h => `${esc(h.name)}${h.address ? ' · ' + esc(h.address) : ''}`))}</ul>` : '<p>No hospital inside this boundary.</p>'}
      <p style="font-size:12px;color:#9B8E88">Source: New York State Department of Health facility list (health.data.ny.gov vn5v-hh5r).</p>
      <h2>Recorded sales, last 12 months</h2>
      ${dof.length ? `<ul>${li(dof.map(r => `${GROUP_LABELS[r.group]}: median ${money(r.median)} (${r.n} sales, ${esc(r.neighborhood)}, through ${r.latest})`))}</ul>` : `<p>Fewer than ${MIN_RECORDS} recorded sales matched this neighborhood's name; see the <a href="/market">Market page</a>.</p>`}
      <p style="font-size:12px;color:#9B8E88">Source: NYC Department of Finance Rolling Sales (NYC Open Data usep-8jbt), by the Department's own neighborhood names; shown with 10 or more sales.</p>
      <p style="font-size:12px;color:#9B8E88">Cuna describes neighborhoods by what is there, never by who lives there. Every home on Cuna is offered in line with federal, New York State and New York City fair housing law.</p>
    </main>`
  return template
    .replace(/<title>[^<]*<\/title>/, head)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
}

function renderIndex(template, hoods) {
  const byBorough = {}
  hoods.forEach(h => (byBorough[h.borough] ||= []).push(h))
  const head = `<title>New York City neighborhoods | Cuna</title>
    <meta name="description" content="Every New York City neighborhood on Cuna: homes for rent and sale, subway, schools, hospitals and recorded sales, from public records." />
    <link rel="canonical" href="${SITE}/neighborhoods" />`
  const body = `<main style="max-width:760px;margin:0 auto;padding:24px;font-family:'DM Sans',system-ui,sans-serif;color:#2C2420">
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif">New York City neighborhoods</h1>
      ${Object.entries(byBorough).map(([b, list]) => `<h2>${esc(b)}</h2><ul>${list.map(h => `<li><a href="/neighborhoods/${h.slug}">${esc(h.name)}</a></li>`).join('')}</ul>`).join('')}
    </main>`
  return template.replace(/<title>[^<]*<\/title>/, head).replace('<div id="root"></div>', `<div id="root">${body}</div>`)
}

async function main() {
  if (process.env.PRERENDER === '0') { console.log('[prerender] skipped (PRERENDER=0)'); return }
  loadEnv()
  const url = process.env.VITE_SUPABASE_URL, key = process.env.VITE_SUPABASE_ANON_KEY
  const templatePath = resolve(DIST, 'index.html')
  if (!url || !key || !existsSync(templatePath)) { console.log('[prerender] skipped: no Supabase env or no dist/index.html'); return }
  const template = readFileSync(templatePath, 'utf8')
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const { data: hoods, error } = await supabase.from('neighborhoods').select('id, slug, name, borough, area_km2').eq('kind', 'neighborhood').order('name')
  if (error || !hoods?.length) { console.warn('[prerender] skipped: neighborhoods unreadable', error?.message); return }
  const { data: geo, error: gerr } = await supabase.rpc('neighborhoods_geojson')
  if (gerr || !geo?.features) { console.warn('[prerender] skipped: shapes unreadable', gerr?.message); return }
  const shapeById = {}
  geo.features.forEach(f => { shapeById[f.properties?.id || f.id] = f.geometry })

  const [stationsRaw, listingsRaw, schoolsRaw, hospitalsRaw] = await Promise.all([
    safe('subway', async () => (await supabase.from('subway_stations').select('complex_id, name, routes, ada, lat, lng').limit(2000)).data || [], []),
    safe('listings', async () => (await supabase.from('listings').select('id, neighborhood_id, address, price, listing_type, bedrooms, bathrooms').in('status', ['active', 'in_contract']).limit(5000)).data || [], []),
    safe('schools', () => getJson('https://data.cityofnewyork.us/resource/wg9x-4ke6.json?$select=location_name,grades_final_text,grades_text,location_category_description,location_type_description,primary_address_line_1,latitude,longitude&$where=status_descriptions=\'Open\' AND latitude is not null&$limit=5000'), []),
    safe('hospitals', () => getJson('https://health.data.ny.gov/resource/vn5v-hh5r.json?$select=facility_name,address1,city,latitude,longitude&$where=description=\'Hospital\' AND county in(\'Kings\',\'New York\',\'Queens\',\'Bronx\',\'Richmond\')&$limit=500'), []),
  ])
  const since = sinceTwelveMonths()
  const dofByBorough = {}
  for (const [b, d] of Object.entries(BOROUGH_DIGIT)) dofByBorough[b] = await safe(`DOF ${b}`, () => fetchDofMedians(d, since), [])

  const schools = schoolsRaw.map(shapeSchool).filter(s => Number.isFinite(s.lat))
  const hospitals = hospitalsRaw.map(shapeHospital).filter(h => Number.isFinite(h.lat))

  const urls = [`${SITE}/`, `${SITE}/neighborhoods`, `${SITE}/market`, `${SITE}/help`, `${SITE}/new-to-ny`]
  let written = 0
  for (const hood of hoods) {
    const geometry = shapeById[hood.id]
    if (!geometry) continue
    const inside = (p) => geometryContains(geometry, p.lng, p.lat)
    const listings = listingsRaw.filter(l => l.neighborhood_id === hood.id)
    const model = {
      hood, listings, summary: listingSummary(listings),
      stations: groupStations(stationsRaw.filter(inside)),
      schools: schools.filter(inside).sort((a, b) => a.name.localeCompare(b.name)),
      hospitals: hospitals.filter(inside),
      dof: dofRowsFor(hood.name, dofByBorough[hood.borough] || []),
    }
    const dir = resolve(DIST, 'neighborhoods', hood.slug)
    mkdirSync(dir, { recursive: true })
    writeFileSync(resolve(dir, 'index.html'), renderPage(template, model))
    urls.push(`${SITE}/neighborhoods/${hood.slug}`)
    written++
  }
  mkdirSync(resolve(DIST, 'neighborhoods'), { recursive: true })
  writeFileSync(resolve(DIST, 'neighborhoods', 'index.html'), renderIndex(template, hoods))
  writeFileSync(resolve(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`)
  if (!existsSync(resolve(DIST, 'robots.txt'))) writeFileSync(resolve(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`)
  console.log(`[prerender] ${written} neighborhood pages, index and sitemap written (schools ${schools.length}, hospitals ${hospitals.length}, stations ${stationsRaw.length}, listings ${listingsRaw.length})`)
}

main().catch(err => { console.warn('[prerender] failed, build continues:', err.message) })
