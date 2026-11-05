# StreetEasy feature audit — build progress

This file is how a new session resumes. It holds the prompt that drives the
work, the "Needs Joseph" list, and the checklist with each item's state.
Update and commit it after every finished item.

## Needs Joseph

(Items that need an account, a key, a decision or a sign-in. Nothing here
blocks a wave: unfinished UI is hidden behind a flag or left out.)

### NJ-1 · Names for the NTA areas trimmed around your 14 custom areas (1.2)

The 2020 NTA shapes are loaded citywide (262 areas) with your 14 street-drawn
areas laid on top. Every NTA your areas touched lost that ground, so nothing
overlaps. Where an NTA's hyphenated name contained one of your area names,
that part was removed automatically. Two NTAs were swallowed whole and are
not in the table: **Upper East Side-Carnegie Hill** and **Astoria (Central)**.

Please confirm or rename each of these remainders (name in the table →
area now, area before, in km²). Say "keep", give a new name, or say "merge
into X" and I will write the SQL.

| area now (slug) | km² now | was | note |
|---|---|---|---|
| Williamsburg (rest) (williamsburg-rest) | 1.47 | 2.68 | the NTA minus your Williamsburg; 3 pieces |
| South Williamsburg | 0.70 | 1.41 | |
| Greenpoint | 3.03 | 3.28 | |
| East Williamsburg | 4.83 | 4.86 | |
| Boerum Hill (boerum-hill) | 1.09 | 2.20 | was "Downtown Brooklyn-DUMBO-Boerum Hill" |
| Brooklyn Heights | 0.85 | 0.93 | |
| Fort Greene | 1.62 | 1.63 | |
| Bedford-Stuyvesant (West) | 3.42 | 3.43 | |
| Red Hook (red-hook) | 3.09 | 5.65 | was "Carroll Gardens-Cobble Hill-Gowanus-Red Hook"; includes the Columbia St waterfront |
| Park Slope | 2.40 | 2.40 | |
| Kensington | 1.62 | 1.62 | |
| Flatbush (rest) (flatbush-rest) | 0.77 | 2.23 | the NTA "Flatbush" minus your Flatbush / Ditmas Park; 3 pieces |
| Flatbush (West)-Parkville | 0.82 | 2.13 | was "Flatbush (West)-Ditmas Park-Parkville" |
| East Flatbush-Erasmus | 1.72 | 1.84 | |
| Battery Park City (battery-park-city) | 0.72 | 1.79 | was "Financial District-Battery Park City" |
| Tribeca-Civic Center | 0.99 | 1.26 | |
| West Village | 1.33 | 1.34 | |
| Hudson Yards (hudson-yards) | 1.14 | 2.76 | was "Chelsea-Hudson Yards" |
| Midtown South-Flatiron-Union Square | 1.20 | 1.38 | |
| Midtown-Times Square | 2.22 | 2.28 | |
| Kips Bay (kips-bay) | 1.07 | 1.47 | was "Murray Hill-Kips Bay" |
| Lenox Hill-Roosevelt Island | 0.75 | 2.00 | was "Upper East Side-Lenox Hill-Roosevelt Island"; what is left is mostly Roosevelt Island |
| Yorkville (yorkville) | 0.38 | 1.27 | was "Upper East Side-Yorkville"; a strip along the river |
| Manhattanville-West Harlem | 0.91 | 1.00 | |
| Hamilton Heights-Sugar Hill | 1.23 | 1.48 | |
| Harlem (South) | 0.23 | 1.34 | small leftover around your Harlem's edges |
| Harlem (North) | 0.27 | 2.21 | small leftover (north of your Harlem) |
| East Harlem (North) | 2.38 | 2.43 | |
| Astoria (North)-Ditmars-Steinway | 3.20 | 5.42 | |
| Old Astoria-Hallets Point | 0.36 | 1.03 | |
| Astoria (East)-Woodside (North) | 0.89 | 2.42 | |
| Queensbridge-Ravenswood-Dutch Kills | 0.37 | 2.58 | your Long Island City took Dutch Kills |
| Hunters Point (hunters-point) | 0.16 | 2.56 | was "Long Island City-Hunters Point"; a sliver, 3 pieces |
| Sunnyside | 3.96 | 4.43 | |
| Astoria Park (park) | 0.01 | 0.25 | your Astoria covers the park; the leftover is a speck |
| Central Park (park) | 3.55 | 3.56 | |
| The Battery-Governors Island-Ellis Island-Liberty Island (park) | 1.10 | 1.11 | |
| St. Michael's Cemetery (cemetery) | 0.40 | 0.41 | |
| Sunnyside Yards (North) (other) | 0.31 | 0.42 | |
| Sunnyside Yards (South) (other) | 0.43 | 0.82 | |

Also: 34 slivers under 2,500 m² (a quarter of a block) left behind by the
cuts were dropped; nothing is uncovered because your areas cover that ground.

### NJ-3 · Brooklyn splits (1.3): which areas to split, and where

Every Brooklyn residential area now in the table (NTA 2020 names after the
custom overlay; rough size in km²). Tell me the splits as street lines, e.g.
"split Bedford-Stuyvesant (West) at Tompkins Ave, west = Bed-Stuy West,
east = Bed-Stuy East". I will not invent any. The script
`scripts/split-neighborhood.mjs` turns each answer into a SQL file in a few
seconds (it finds the street in OpenStreetMap, cuts the area edge to edge,
moves listings and saved searches onto the halves); it rewrites one existing
row, so each split runs only on your go.

Your 8 custom Brooklyn areas (already drawn, not NTAs): Carroll Gardens 0.72,
Cobble Hill 0.34, Gowanus 1.50, DUMBO 0.41, Downtown Brooklyn 0.79,
Flatbush / Ditmas Park 2.89, Williamsburg 2.02 (+ Greenpoint stays NTA).

| area | km² | | area | km² |
|---|---|---|---|---|
| Greenpoint | 3.03 | | Borough Park | 3.76 |
| Williamsburg (rest) | 1.47 | | Kensington | 1.62 |
| South Williamsburg | 0.70 | | Mapleton-Midwood (West) | 2.91 |
| East Williamsburg | 4.83 | | Gravesend (South) | 2.40 |
| Brooklyn Heights | 0.85 | | Coney Island-Sea Gate | 4.42 |
| Boerum Hill | 1.09 | | Brighton Beach | 1.26 |
| Fort Greene | 1.62 | | Flatbush (rest) | 0.77 |
| Clinton Hill | 1.35 | | Flatbush (West)-Parkville | 0.82 |
| Bedford-Stuyvesant (West) | 3.42 | | Midwood | 2.99 |
| Bedford-Stuyvesant (East) | 3.84 | | Gravesend (East)-Homecrest | 3.24 |
| Bushwick (West) | 2.15 | | Madison | 2.54 |
| Bushwick (East) | 2.60 | | Sheepshead Bay-Manhattan Beach-Gerritsen Beach | 5.89 |
| Cypress Hills | 2.26 | | Ocean Hill | 1.87 |
| East New York (North) | 2.59 | | Brownsville | 2.86 |
| East New York-New Lots | 4.32 | | East Flatbush-Erasmus | 1.72 |
| Spring Creek-Starrett City | 2.52 | | East Flatbush-Farragut | 2.24 |
| East New York-City Line | 2.93 | | East Flatbush-Rugby | 2.53 |
| Red Hook | 3.09 | | East Flatbush-Remsen Village | 1.71 |
| Park Slope | 2.40 | | Flatlands | 5.05 |
| Windsor Terrace-South Slope | 1.42 | | Marine Park-Mill Basin-Bergen Beach | 5.47 |
| Sunset Park (West) | 4.68 | | Canarsie | 6.55 |
| Sunset Park (Central) | 1.74 | | Prospect Heights | 0.96 |
| Sunset Park (East)-Borough Park (West) | 1.09 | | Crown Heights (North) | 3.29 |
| Bay Ridge | 5.73 | | Crown Heights (South) | 1.86 |
| Dyker Heights | 2.71 | | Prospect Lefferts Gardens-Wingate | 2.23 |
| Bensonhurst | 4.52 | | Bath Beach | 1.91 |
| Gravesend (West) | 3.14 | | | |

### NJ-4 · Transit (subway) commute times: pick a provider or wait (2.3)

The listing page shows walking and driving times from Mapbox. Mapbox has no
public-transit routing, so there is no subway time. Three ways to add one;
I have not picked:

| option | what it costs | notes |
|---|---|---|
| Google Routes API, transit mode | $5 per 1,000 requests after Google's $200/month free credit (about 40,000 free requests a month) | Best NYC transit coverage; needs a Google Cloud project, a billing account and a key restricted to hellocuna.com |
| HERE Public Transit API | Free up to 250,000 requests a month on the Freemium plan, then about $1 per 1,000 | Needs a HERE developer account and an API key; coverage good in NYC |
| Self-hosted OpenTripPlanner with the MTA GTFS feeds | Free software; a small always-on server (~$20–40 a month) and someone to keep the GTFS files current | No per-request cost or vendor key; most work for us |

Reply with one of the three (or "wait"), and for Google or HERE create the
account and give me the key as a Vercel server-side env var name (never a
VITE_ var); I will wire it behind a flag.

### NJ-2 · Mapbox token URL restriction (1.1, not blocking)

The token in VITE_MAPBOX_TOKEN is a public token and ships in the browser,
as Mapbox intends. To stop anyone else using it: Mapbox → Account → Tokens →
that token → URL restrictions → add `https://hellocuna.com/*`,
`https://*.vercel.app/*` and `http://localhost:*/*` → Save.

- **NJ-5 — XML listing-feed import (4.7).** Design is in `docs/xml-feed-design.md`; `api/feed-import.js` is a stub that answers 501 unless `FEED_IMPORT_ENABLED=true` (leave it unset). Before it is built, decide: (a) which format the first brokerages actually have (a custom XML file, or a RESO Web API / RETS server Cuna should pull from instead); (b) whether Cuna links to their photo URLs or copies photos into Supabase Storage; (c) who may register a feed (brokerage owners only, or any verified poster). Reply in chat and the import gets built in a later wave.

## Database changes applied (production)

| date | script | sha256 (first 16) | tab | result |
|---|---|---|---|---|
| 2026-11-05 | backup: `cuna-security/backups/2026-11-05/` (42-backup-counts.sql, 42-backup-dump.sql, read-only) | 24aae4e5… / 74db7166… | …/sql/2b11871d… / …/sql/09e8fa6f… | 14 tables, 11,580-byte JSON, hash 7b9f47f2… verified locally; counts match |
| 2026-11-05 | `42-schema-snapshot.sql` (read-only) | b462bd05… | …/sql/76b3bf39… | schema read before writing wave 1 |
| 2026-11-05 | `42-wave1-search-test.sql` (role simulation, ROLLED BACK) | 9eeaac69… | …/sql/d022eda9… | 57 checks, 0 FAIL (`42-test-report.txt`) |
| 2026-11-05 | **`42-wave1-search.sql` APPLIED** | db163ea5… | …/sql/6e17ed37… | postgis 3.3.7 + http 1.6; neighborhoods 274 rows (14 custom, 40 NTAs trimmed); listings +8 columns +3 triggers; neighborhood_for_point, neighborhoods_geojson, search_listings; renter_profiles.search_state; saved_searches + notify trigger; notifications.kind += saved_search |

| 2026-11-05 | counts re-check before 44 (42-backup-counts.sql, read-only) | 24aae4e5… | …/sql/8985e44e… | identical to the morning backup (only my new tables added: neighborhoods 274, saved_searches 0), so that backup still covers every pre-existing row |
| 2026-11-05 | `44-wave2-listing-page-test.sql` (role simulation, ROLLED BACK) | 92d7084d… | …/sql/f7588b35… | 40 checks, 0 FAIL (`44-test-report.txt`) |
| 2026-11-05 | **`44-wave2-listing-page.sql` APPLIED** | d4fba608… | …/sql/d07c4299… | subway_stations 496 rows; listings + floor_plans, video_url, tour_3d_url, months_free, lease_term_months, generated net_effective_price; search_listings re-created with p_price_basis (old signature dropped); saved_search_matches, listings_record_event, details_fields_sorted, get_listing_public re-created; listing_reports + guard trigger + admin_listing_reports / admin_resolve_report; nearby_subway_stations, neighborhood_shape |

| 2026-11-05 | `45-wave3-sales-test.sql` (role simulation, ROLLED BACK) | ba85a7c7… | …/sql/3775838f… | 29 checks, 0 FAIL (`45-test-report.txt`); a first file had a generator bug (see the report) |
| 2026-11-05 | **`45-wave3-sales.sql` APPLIED** | 10ba7d8b… | …/sql/85ad2d6c… | listings + listing_type (default rent), property_type, common_charges, maintenance, monthly_taxes, tax_deductible_pct, financing_allowed_pct; status check gains 'sold'; trigger `listings_a_type_rules`; status_label, details_fields_sorted, listings_record_event, get_listing_public re-created; search_listings re-created with p_listing_type (44 signature dropped); saved_search_matches honors filters.listing_type; `recorded_sales_cache` (service role only); `past_listings_at` |

Rollback for 42: `cuna-security/42-wave1-search-rollback.sql`; for 44: `44-wave2-listing-page-rollback.sql`; for 45: `45-wave3-sales-rollback.sql` (none run).
| 46 | `46-wave4-broker-tools-test.sql` | 2026-11-05 ~16:08 | tab …/sql/95ff2537… hash 06f26798… · 49 checks, 0 FAIL, ROLLED BACK (poster, renter, anon, admin-as-agent). A first run in tab …/sql/c6e348f0… failed at `listing_stats` (inquiries.status did not exist yet); the lead-inbox block was moved ahead and the test re-run. Report: cuna-security/46-wave4-broker-tools-test-report.txt |
| 46 | `46-wave4-broker-tools.sql` | 2026-11-05 ~16:10 | tab …/sql/17e9a1b2… hash 291b66c6…, dialog "Run query". Post-asserts passed; final select: swipes keeps only the five renter policies, listings gains the two brokerage-owner policies, inquiries.status default 'new', listing_views / listing_flags / brokerages empty. Backup: the 2026-11-05 export still covers every user table — `42-backup-counts.sql` re-run first in tab …/sql/3afc5b59… (users 3, listings 1, profiles 3, inquiries 0, swipes 0, notifications 6, events 6, open houses 2, photos 3: identical to counts.json; the only new tables are ones the wave scripts created). Rollback written, not run: 46-wave4-broker-tools-rollback.sql |

## Merge log

| wave | PR | merge commit | production check |
|---|---|---|---|
| 1 | [#22](https://github.com/josephsilverman878-crypto/cuna/pull/22) squash-merged 2026-11-05 | `122ca2f` (branch tip 3d2b178) | Vercel production "Deployment has completed" on 122ca2f (15:03 local); hellocuna.com serves bundle `index-DZpGVLy7.js`, identical to the local build of the merged code. Spot-check in Joseph's Chrome (signed in as the poster test account): home → dashboard renders, listing page renders (fees, open house), no console errors; Post listing address lookup shown below. Feed/map, filters and saved searches need a RENTER sign-in and were NOT checked live (verified at 375px on the dev server and by the 57-check role simulation). Preview smoke (branch alias): steps 1, 2, 7 pass; 3–6, 8 need sign-in. |
| 2 | [#23](https://github.com/josephsilverman878-crypto/cuna/pull/23) squash-merged 2026-11-05 | `b49121e` (branch tip a274a06) | Vercel production "Deployment has completed" on b49121e (15:33 local); hellocuna.com serves bundle `index-D1dBanN5.js`, identical to the local build of the merged code. Spot-check in Joseph's Chrome (poster test account): home → dashboard, listing page renders with the share control (the report link is hidden for the listing's own poster, as designed), no console errors. Map/subway/commute need a geocoded listing and the admin Reports tab needs the admin account; both verified on the dev server and by the 40-check role simulation, not live. Preview smoke: steps 1–2 pass; 3–8 flagged. |
| 3 | [#24](https://github.com/josephsilverman878-crypto/cuna/pull/24) squash-merged 2026-11-05 | `105629e` (branch tip e6c8311) | Vercel production deployment status "success" on 105629e (15:51 local); hellocuna.com serves bundle `index-DAt7uBSq.js`, the same bundle the preview served for the branch tip. Spot-check in Joseph's Chrome (poster test account): home → dashboard renders, /privacy renders, no console errors; `/api/recorded-sales?bbl=3010110023` returns one ACRIS deed and, on the second server hit, `cached: true` (the row is in `recorded_sales_cache`). Note: the route sends `Cache-Control: public, max-age=3600`, so a browser repeats its own first answer for an hour; that is why the preview looked uncached. Feed Rent/Buy, sale listing page and the Sold status need the renter / a sale listing and were verified on the preview harness and by the 29-check role simulation, not live. |
| 4 | [#25](https://github.com/josephsilverman878-crypto/cuna/pull/25) squash-merged 2026-11-05 | `6e2edd0` (branch tip c2719fe) | Vercel production deployment status "success" on 6e2edd0 (16:28 local); hellocuna.com serves bundle `index-CA6mbctV.js`, identical to the local build and to the preview (cuna-hu14y4bg1…). Preview smoke signed out: home, /agent/:id, a listing page with "Listed by", /api/feed-import → 501, all pass. Production spot-check in Joseph's Chrome (poster test account): dashboard tiles (Views 7 days / all time, Leads), tools row, Stats button, /leads (filters, empty inbox), /team (create form), /demand (0 saved searches, buckets note) all render; /admin says "Not authorized" because that account is not the admin. Admin Flags tab and the two public-record checks were verified on the dev server (license: live match against a real NY DOS licensee; owner: live PLUTO lookup) and by role simulation, not live. Renter steps (feed, save, tour request) not run live: no renter session. |

---

## The prompt (copied verbatim)

You are building Cuna's "StreetEasy feature audit" phase: five waves of features. Work through as much as you can in this session, wave by wave, without stopping for routine questions. Read CLAUDE.md and ~/Desktop/CUNA/cuna-security/HANDOFF.md first and follow every rule in them, except where the permissions below explicitly expand them.

=== PERMISSIONS FOR THIS PROMPT ===
I explicitly allow you to:
- Create feature branches, commit, and push them.
- Open pull requests and SQUASH-MERGE them into main, which deploys to production on hellocuna.com, following the merge rules in "How to work" below.
- Run ADDITIVE SQL in Supabase (create table/column/index/extension/function/policy, enable PostGIS), but only after taking a backup export the way HANDOFF.md describes, and testing with role simulation in the SQL editor ending in ROLLBACK before applying. If your safety rules block a privilege-changing statement, write it out for me with click-by-click steps instead.

I do NOT allow, without my explicit command in chat:
- Any SQL that drops, deletes, truncates, renames, or rewrites existing data.
- Sending email to real people. All new email types must be off in production behind their own env flag (default off); on previews, send only to INQUIRY_TEST_RECIPIENT.
- Turning on any feature flag in production.
- Changing who is admin.
- Force-pushing to main or rewriting main's history.
- Committing any secret. .env.local stays uncommitted (the repo is public).

=== HOW TO WORK ===
1. First, copy this entire prompt into the top of a new file docs/audit-build-progress.md. Below it, add the full checklist, each item marked todo / in progress / done / blocked (with reason). Update and commit it after every finished item. This file is how a new session resumes.
2. One branch per wave, each created from the latest main: feature/wave1-search, feature/wave2-listing-page, feature/wave3-sales, feature/wave4-broker-tools, feature/wave5-content. Finish and merge a wave before starting the next.
3. Commit after each finished item with a clear message.
4. If an item needs me (an account, a key, a decision, a sign-in), do NOT stop. Mark it blocked, add the exact question or click-by-click steps to a "Needs Joseph" section at the top of the progress file, and move on. Blocked items must not break the wave: hide unfinished UI behind a flag or leave it out.
5. Before marking any item done: npm run build passes, no console errors, it works at phone width (375px), and it passes src/lib/fairHousing.js where text is involved.
6. MERGE RULES, at the end of each wave:
   a. Push the branch and open a PR whose description lists what was built, every SQL change applied, every env var needed, and a smoke checklist of at most 8 steps (flag steps that need my sign-in).
   b. Wait for the Vercel preview, verify the preview's commit SHA matches your latest commit, then run the smoke checklist yourself in the browser on the preview (skip only steps that need my sign-in, and note them).
   c. Only if everything passes: squash-merge into main.
   d. Wait for the production deploy, verify the production commit SHA matches the merge, and spot-check hellocuna.com: home page, feed, a listing page, and the main new feature of that wave.
   e. If production breaks: immediately revert the merge with a new revert PR (squash-merge it), confirm the site is healthy again, note what happened in the progress file, and fix it on a new branch. Never leave the live site broken.
   f. Log the merge commit and production check result in the progress file.
7. Mobile-first. Match the existing brand: terracotta #C4714A, sand #F5F0E8, Cormorant Garamond + DM Sans, existing component patterns.
8. Fair housing everywhere: no demographic data layers, no steering language ("safe", "good for families", etc.), no fields asking about source of income, and the posters-see-counts-only rule stays.
9. Do not touch the quiz's existing price data or add any StreetEasy scraping or fetching.

=== WAVE 1: SEARCH CORE ===
1.1 Map setup: add Mapbox GL JS using VITE_MAPBOX_TOKEN (already in Vercel for Production and Preview, and in .env.local). Style the map in Cuna's palette.
1.2 Citywide neighborhoods: enable PostGIS; create a neighborhoods table (name, slug, borough, geometry, source, kind = neighborhood | park | airport | cemetery). Load NYC Department of City Planning 2020 Neighborhood Tabulation Areas from NYC Open Data. Overlay my existing custom 14 (find them in src/lib) so they take priority; trim neighboring areas so there are no gaps or overlaps. Parks, airports and cemeteries: kind != neighborhood, shown on the map, excluded from neighborhood lists and search.
1.3 Brooklyn split prep: list every Brooklyn area with a rough size, and add to "Needs Joseph" a request for my splits, written as street lines (e.g. "split Bed-Stuy at Tompkins Ave"). Build a small script that applies a split from a street line so it's fast once I answer. Do NOT invent splits yourself.
1.4 Auto-assign neighborhoods: on listing create/edit, geocode the address with NYC GeoSearch (geosearch.planninglabs.nyc, free, no key), store lat/lng and BBL/BIN if returned, and set the neighborhood by point-in-polygon. The neighborhood field becomes read-only for posters (show the result). Backfill existing listings (additive: fill empty new columns only). Handle failed geocodes gracefully with a visible error.
1.5 Map search: a map view in the feed with listing pins synced to the list; tap neighborhoods to select/deselect; draw-your-own-area (polygon) search; clear button. Selected areas filter the feed.
1.6 Filter panel: editable in the feed (price min/max, beds, baths, min sqft, neighborhoods, amenities, pets policy, net effective vs gross price once 2.5 exists). Persist the last-used filters per user.
1.7 Sort: newest, price low to high, price high to low, largest sqft, recently updated.
1.8 Saved searches: save current filters + map area with a name; list/edit/delete them in Profile. New matching listings trigger a bell notification immediately and are included in the existing daily digest (/api/alerts-digest, same cron). Email for saved searches goes behind a new env flag SAVED_SEARCH_EMAILS_ENABLED, default off.

=== WAVE 2: LISTING PAGE DEPTH ===
2.1 Location map on the listing page (pin + neighborhood outline).
2.2 Nearby subway stations and lines from the MTA's public station data (NY Open Data), with walking distance. Load station data into the database, not live-fetched per page.
2.3 Commute time: renter enters a destination; show walking and driving time via Mapbox. Mapbox does not do public transit; add the transit question to "Needs Joseph" with 2–3 provider options and costs, don't pick one.
2.4 Floor plans (image upload, separate from photos) and video/3D tours as links (YouTube, Vimeo, Matterport embeds). No video file hosting.
2.5 Net effective rent: fields months_free and lease_term_months; compute net effective; show gross and net, clearly labeled, on cards and listing page; usable in filters and sort.
2.6 Share: native share sheet on mobile, copy-link fallback.
2.7 Report a listing: reasons list + optional note; stored in a reports table; visible in /admin with resolve status. Logged-in only, rate-limited.

=== WAVE 3: SALES ===
3.1 listing_type = rent | sale. Sale fields: property type (co-op, condo, house, multi-family, townhouse), asking price, common charges, maintenance, monthly taxes, tax-deductible %, financing allowed %. Sale statuses: Active / In contract / Sold / Off-market.
3.2 Rent/Buy toggle across feed, map, filters, saved searches, alerts. Post and Edit forms switch fields by type. Sales listings are free to post.
3.3 Recorded sales history from NYC public records only: DOF Rolling Sales and ACRIS via NYC Open Data, matched by BBL. Show on sale listing pages (and building pages in wave 5) with "Source: NYC Department of Finance, as of [date]". Note co-op gaps honestly.
3.4 Past sales and rentals on Cuna: Sold / Rented Cuna listings show in a "Past listings" section with final status and date.

=== WAVE 4: BROKER TOOLS ===
4.1 Fair-housing fix first: posters must not be able to read individual swipe/save rows or renter IDs on their listings. Replace with aggregate-count functions; tighten RLS; test with role simulation.
4.2 Listing stats: views (deduped per session, no identities), saves (counts), inquiries, per listing and over time, in the dashboard.
4.3 Lead inbox: all inquiries in one list with status (new / replied / toured / closed), filters, and a link to the email thread.
4.4 Agent profile pages (/agent/:id): photo, bio, brokerage, license number, active and past Cuna listings.
4.5 Brokerage verification: check license number and name against NY DOS's public Active Real Estate Licensees dataset on data.ny.gov; show match/mismatch in /admin; I still approve manually.
4.6 Owner verification: owner-posters give the property address; compare against public NYC property owner records (PLUTO/ACRIS); show the result in /admin for my manual approval.
4.7 Bulk posting: CSV template download + upload with row-by-row validation preview before anything is created. Feed (XML) import: write a design doc and stub only; add to "Needs Joseph".
4.8 Duplicate and fake detection: block a second active listing at the same address + unit; flag suspicious listings (price far below neighborhood norms, reused photos) for /admin review.
4.9 Team accounts: brokerages table, members with roles (owner, agent), brokerage owner can view and manage team listings.
4.10 Demand dashboard for verified posters: counts of saved searches by neighborhood, bedrooms and price band. Only show a bucket with 3 or more searches. No renter identities, no demographic fields.
4.11 Listing quality rules: minimum 3 photos, FARE fee fields required, price sanity check, fair-housing scan (already exists) on submit. Apply to new and edited listings only; don't unpublish existing ones.

=== WAVE 5: CONTENT AND EXTRAS ===
5.1 Building pages (/building/:bbl): building facts from PLUTO (year built, units, floors), all Cuna listings in it (active and past), recorded sales.
5.2 Market data page: medians and counts by neighborhood from DOF sales and Cuna's own listings only, each with source and date; hide any figure based on fewer than 10 records.
5.3 Neighborhood pages (/neighborhoods/:slug) built for search engines: pre-render them at build time (this is a Vite SPA, so plain client routes won't index well). Content from our data: listings, schools, hospitals, subway, market data, with sources. Fair-housing language rules apply.
5.4 Help center (/help): FAQ for renters, buyers and posters, plus contact hello@hellocuna.com.
5.5 Google and Apple sign-in via Supabase auth. Build the buttons and flows behind a flag (off until configured). New OAuth users must pass the same terms-acceptance gate as email signups. Add click-by-click setup steps for me to "Needs Joseph" (Google Cloud OAuth client; Apple Developer account, which is paid).
5.6 Rental applications / verified renter profile: renter fills a reusable profile (employment, income amount, move-in date, references, optional documents in a private storage bucket with strict RLS) and chooses to share it with a poster through a tour request. Never collect SSNs, bank or card numbers, or source of income. Cuna charges no application fee. Renter can delete their application data.
5.7 Policy update: update Privacy.jsx and Terms.jsx to cover everything new (geocoding, view tracking, saved searches, applications, documents, OAuth, reports), with a new "last updated" date. Put the full text of the changes in the PR description and do NOT merge wave 5 until I've replied "approved" on the policy text in chat; merge everything else in wave 5 without it if needed by splitting the policy into its own PR.

=== WHEN YOU STOP ===
Whether you finish or run out of room: update docs/audit-build-progress.md, commit and push the current branch, and give me a short summary: what's merged and live, what's in progress, the "Needs Joseph" list, and the exact next item.

---

## Checklist

States: `todo` · `in progress` · `done` · `blocked (reason)`

### Wave 1 — search core (branch `feature/wave1-search`)

| item | state | notes |
|---|---|---|
| 1.1 Map setup (Mapbox GL JS, Cuna palette) | done | `src/lib/mapbox.js` (lazy-loaded, palette by layer type), `src/components/MapView.jsx`. Token = public pk. token; NJ-2 asks for URL restriction |
| 1.2 Citywide neighborhoods (PostGIS, NTA 2020, custom 14 overlay) | done | `42-wave1-search.sql` applied: 274 areas (209 neighborhoods incl. the 14 custom, 40 parks, 14 cemeteries, 2 airports, 9 "other" for Rikers/Navy Yard/rail yards/forts/UN). Custom 14 came from `cuna-security/data/boundaries.geojson` (the approved street-drawn set; src/lib holds only the quiz data). Trimmed-NTA names in NJ-1. Client: `src/lib/areas.js` |
| 1.3 Brooklyn split prep (list + split script) | done | list + request in NJ-3; `scripts/split-neighborhood.mjs` writes the SQL for one split (street from OpenStreetMap, edge-to-edge cut, listings and saved searches moved); runs only on Joseph's go because it replaces one row |
| 1.4 Auto-assign neighborhoods (GeoSearch, point-in-polygon, backfill) | done | `src/lib/geocode.js` + `LocationCheck.jsx` in Post/Edit (debounced lookup, match only with a house number, visible error + typed fallback); DB trigger `listings_assign_neighborhood` sets neighborhood_id/text from the point so the poster's text never wins; `43-backfill-geocode.sql` run: 0 of 1 listings geocodable (the only row is the placeholder "TEST LISTING – please ignore") |
| 1.5 Map search (pins, tap neighborhoods, draw area, clear) | done | `FeedMap.jsx`: areas layer (parks etc. drawn, not selectable), pins from `search_listings`, tap to select, draw polygon (tap corners → Done), Clear; verified at 375px on the dev server |
| 1.6 Filter panel (persisted per user) | done | `FilterSheet.jsx` bottom sheet; persisted in `renter_profiles.search_state` (debounced); first-time seed from the Profile preferences. Net-effective toggle waits for 2.5 |
| 1.7 Sort | done | newest · price ↑ · price ↓ · largest · recently updated (`updated_at` now maintained by trigger `listings_touch_updated_at`, views ignored) |
| 1.8 Saved searches (+ bell, digest, SAVED_SEARCH_EMAILS_ENABLED) | done | `saved_searches` table (own rows, ≤20), "Save search" in the feed, Profile card (show/rename/delete); trigger `listings_notify_saved_searches` → bell row kind `saved_search` for NEW active listings (never the poster, one per listing); digest emails them only when `SAVED_SEARCH_EMAILS_ENABLED=true` (unset = off; rows marked handled) |
| Wave 1 merge (PR, preview smoke, squash-merge, production check) | done | PR #22 → main 122ca2f, live on hellocuna.com 2026-11-05 (see Merge log). Post-listing lookup checked live as the poster test account: "342 9 STREET, Brooklyn" · Park Slope · BBL, mini-map |

### Wave 2 — listing page depth (branch `feature/wave2-listing-page`)

| item | state | notes |
|---|---|---|
| 2.1 Location map on listing page | done | `ListingMap.jsx`: pin + neighborhood outline (`neighborhood_shape` RPC), "Open in Maps"; shown only for geocoded listings |
| 2.2 Nearby subway stations (MTA data in DB, walking distance) | done | `subway_stations` (496 rows from NY Open Data 39hk-dx4f, loaded once by 44) + `nearby_subway_stations` RPC (transfer complexes collapsed); `NearbySubway.jsx` with Mapbox Matrix walking times, estimate fallback |
| 2.3 Commute time (Mapbox walking/driving; transit question to Needs Joseph) | done | `CommuteCalculator.jsx`: destination via GeoSearch, walking + driving via Mapbox Directions, remembered per browser; transit options in NJ-4 |
| 2.4 Floor plans + video/3D tour links | done | `listings.floor_plans` (up to 4 images under `<poster>/<listing>/floorplans/`), `video_url` (YouTube/Vimeo), `tour_3d_url` (Matterport), DB checks on the hosts; `ListingMedia.jsx` tap-to-load embeds; Post/Edit fields |
| 2.5 Net effective rent | done | `months_free`, `lease_term_months`, generated `net_effective_price`; shown with the gross price on cards and the page, both labeled; filter sheet "Gross / Net effective" basis (`search_listings` p_price_basis, saved searches too); sort "Net effective: low to high" |
| 2.6 Share | done | `ShareButton.jsx`: native share sheet, copy-link fallback; listing page header |
| 2.7 Report a listing | done | `listing_reports` (5/day/user, 1/listing/week, own rows only), `ReportListing.jsx` modal (signed-in only), `/admin` → Reports tab (open/resolved, resolve with note) through `admin_listing_reports` / `admin_resolve_report` |
| Wave 2 merge | done | PR #23 → main b49121e, live 2026-11-05 (see Merge log) |

### Wave 3 — sales (branch `feature/wave3-sales`)

| item | state | notes |
|---|---|---|
| 3.1 listing_type rent/sale + sale fields + sale statuses | done | `listing_type` rent/sale, `property_type`, sale financials (common charges, maintenance, taxes, tax deductible %, financing %), Sold status, `listings_a_type_rules` trigger; `SaleFinancialsFields.jsx`, `SaleDetails.jsx`, `listingTypes.js`, `listingStatus.js` |
| 3.2 Rent/Buy toggle everywhere; forms switch by type | done | header Rent/Buy control in the feed (part of the filters, so persisted and saved with searches), filter sheet "Looking to" + price label/basis per type, map pin labels, `search_listings` p_listing_type, saved searches fire only for their type, quiz results pick rentals or sales by tenure. "Sales listings are free to post" on the form |
| 3.3 Recorded sales history (DOF Rolling Sales + ACRIS by BBL) | done | `/api/recorded-sales?bbl=` (Vercel, service role): DOF Rolling Sales usep-8jbt + ACRIS legals 8h5j-fqxa → master bnx9-e6tj deeds with an amount, per BBL, cached 7 days in `recorded_sales_cache` (no client access); `RecordedSales.jsx` on sale pages with "Source: NYC Department of Finance … as of <date>" and the co-op note |
| 3.4 Past listings on Cuna | done | `past_listings_at` (security definer, public fields only: Sold/Rented at the same BBL or address) + `PastListings.jsx` on every listing page |
| Wave 3 merge | done | PR #24 → main 105629e, live 2026-11-05 (see Merge log) |

### Wave 4 — broker tools (branch `feature/wave4-broker-tools`)

| item | state | notes |
|---|---|---|
| 4.1 Fair-housing fix: aggregate counts only, tighten RLS | done | 46-wave4-broker-tools.sql drops the two poster SELECT policies on `swipes`; `listing_save_counts()` (security definer, own listings, `{listing_id, saves}` only) replaces the row read in `src/lib/swipes.js`. Role simulation: poster reads 0 swipe rows on its own listing, count = 1 |
| 4.2 Listing stats | done | `listing_views` (listing, anonymous session key, NY day; no user id) + `record_listing_view()` dedupes and bumps `listings.views`; `listing_stats()` / `listing_views_daily()` (own listings). `src/lib/stats.js`, `ListingStats.jsx` (30-day bars) on the dashboard; the listing page no longer calls `increment_listing_views` and skips the poster's own visits |
| 4.3 Lead inbox | done | `inquiries.status` (new/replied/toured/closed) + `status_changed_at`, poster-only column grant + policy; `poster_inquiry_contacts()` returns them. `LeadInbox.jsx` (status/kind/listing filters, status select, Reply-by-email link that re-opens the thread subject) at `/leads` and in the dashboard Leads tab; Leads in the poster bottom nav |
| 4.4 Agent profile pages | done | `profiles.bio` (600 chars, fair-housing scanned on save) + `agent_public(id)` (verified posters only, anon-callable): `/agent/:id` with photo/initials, bio, brokerage, license type + number, active and past Cuna listings. Listing pages link to it ("Listed by"); Profile has the bio editor and a View link |
| 4.5 Brokerage verification (NY DOS dataset) | done | `src/lib/licenseCheck.js` reads data.ny.gov yg7h-zjbf by license number in the admin's browser and compares name (token match), type, brokerage and expiry; `VerificationChecks.jsx` on every /admin poster card shows match / partial / mismatch / not found. Checked live against a real licensee: all four ✓. Approval stays manual |
| 4.6 Owner verification (PLUTO/ACRIS) | done | Owner-posters enter the property address on Profile; it is geocoded to a BBL (`profiles.owner_property_address` / `owner_property_bbl`). /admin "Check property owner" reads PLUTO 64uk-42ks (`src/lib/ownerCheck.js`) and compares the recorded owner name with the account; an LLC owner shows as no-match with the hint to ask for a deed. Checked live on BBL 3010110023 |
| 4.7 Bulk posting (CSV) + XML feed design doc/stub | done | `/bulk`: template download (22 columns with a help row), CSV parser, row-by-row preview with every error listed (same rules as the form: fair housing, FARE fees, price band, 3+ photo links), then one insert per valid row with GeoSearch geocoding; duplicates reported per row. `docs/xml-feed-design.md` + `api/feed-import.js` stub (501 unless `FEED_IMPORT_ENABLED=true`, then dry-run only). Feed questions → NJ-5 |
| 4.8 Duplicate and fake detection | done | Unique index `listings_one_live_per_address_idx` (normalized address line, Active/In-contract only) blocks a second live listing; both forms and the CSV path show a plain message on 23505. Trigger `listings_flag_suspicious` writes `listing_flags` (price under half the median of 5+ comparable live listings; photo reused from another poster); `/admin` → Flags lists and resolves them (`admin_listing_flags` / `admin_resolve_flag`) |
| 4.9 Team accounts | done | `brokerages` (one per owner) + `brokerage_members` (owner/agent, one team per user), owner-only insert/rename/remove, `brokerage_add_member(email)` (verified posters not yet on a team), `brokerage_team()` roster (emails for the owner only), two listings policies so the owner reads and updates team listings. `/team` page; EditListing accepts the team owner |
| 4.10 Demand dashboard (buckets of 3+) | done | `demand_buckets()` (verified posters): saved-search counts by neighborhood, bedrooms and price band (rent and sale bands), buckets of 3+ only, no identities. `/demand` page |
| 4.11 Listing quality rules | done | `src/lib/listingQuality.js`: 3+ photos, FARE fee fields filled (0 allowed, blank not) with the NY one-month deposit cap, price band ($500–50,000/mo rent, $50k–100M sale), fair-housing scan; applied on submit of PostListing, EditListing and every CSV row. Existing listings untouched |
| Wave 4 merge | done | PR #25 → main 6e2edd0, live 2026-11-05 (see Merge log) |

### Wave 5 — content and extras (branch `feature/wave5-content`)

| item | state | notes |
|---|---|---|
| 5.1 Building pages | todo | |
| 5.2 Market data page | todo | |
| 5.3 Neighborhood pages (pre-rendered) | todo | |
| 5.4 Help center | todo | |
| 5.5 Google and Apple sign-in (flagged off) | todo | |
| 5.6 Rental applications / verified renter profile | todo | |
| 5.7 Policy update (own PR, needs "approved" in chat) | todo | |
| Wave 5 merge | todo | |

## Session notes

- 2026-11-05: session started. Read CLAUDE.md and cuna-security/HANDOFF.md.
  main = 65688ca (clean). Branch `feature/wave1-search` created from it.
  VITE_MAPBOX_TOKEN added to .env.local (uncommitted; .gitignore covers it).
