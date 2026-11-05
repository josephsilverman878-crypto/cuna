# StreetEasy feature audit — build progress

This file is how a new session resumes. It holds the prompt that drives the
work, the "Needs Joseph" list, and the checklist with each item's state.
Update and commit it after every finished item.

## Needs Joseph

(Items that need an account, a key, a decision or a sign-in. Nothing here
blocks a wave: unfinished UI is hidden behind a flag or left out.)

- _nothing yet_

## Merge log

| wave | PR | merge commit | production check |
|---|---|---|---|
| _none yet_ | | | |

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
| 1.1 Map setup (Mapbox GL JS, Cuna palette) | in progress | |
| 1.2 Citywide neighborhoods (PostGIS, NTA 2020, custom 14 overlay) | todo | |
| 1.3 Brooklyn split prep (list + split script) | todo | |
| 1.4 Auto-assign neighborhoods (GeoSearch, point-in-polygon, backfill) | todo | |
| 1.5 Map search (pins, tap neighborhoods, draw area, clear) | todo | |
| 1.6 Filter panel (persisted per user) | todo | net-effective toggle waits for 2.5 |
| 1.7 Sort | todo | |
| 1.8 Saved searches (+ bell, digest, SAVED_SEARCH_EMAILS_ENABLED) | todo | |
| Wave 1 merge (PR, preview smoke, squash-merge, production check) | todo | |

### Wave 2 — listing page depth (branch `feature/wave2-listing-page`)

| item | state | notes |
|---|---|---|
| 2.1 Location map on listing page | todo | |
| 2.2 Nearby subway stations (MTA data in DB, walking distance) | todo | |
| 2.3 Commute time (Mapbox walking/driving; transit question to Needs Joseph) | todo | |
| 2.4 Floor plans + video/3D tour links | todo | |
| 2.5 Net effective rent | todo | |
| 2.6 Share | todo | |
| 2.7 Report a listing | todo | |
| Wave 2 merge | todo | |

### Wave 3 — sales (branch `feature/wave3-sales`)

| item | state | notes |
|---|---|---|
| 3.1 listing_type rent/sale + sale fields + sale statuses | todo | |
| 3.2 Rent/Buy toggle everywhere; forms switch by type | todo | |
| 3.3 Recorded sales history (DOF Rolling Sales + ACRIS by BBL) | todo | |
| 3.4 Past listings on Cuna | todo | |
| Wave 3 merge | todo | |

### Wave 4 — broker tools (branch `feature/wave4-broker-tools`)

| item | state | notes |
|---|---|---|
| 4.1 Fair-housing fix: aggregate counts only, tighten RLS | todo | |
| 4.2 Listing stats | todo | |
| 4.3 Lead inbox | todo | |
| 4.4 Agent profile pages | todo | |
| 4.5 Brokerage verification (NY DOS dataset) | todo | |
| 4.6 Owner verification (PLUTO/ACRIS) | todo | |
| 4.7 Bulk posting (CSV) + XML feed design doc/stub | todo | |
| 4.8 Duplicate and fake detection | todo | |
| 4.9 Team accounts | todo | |
| 4.10 Demand dashboard (buckets of 3+) | todo | |
| 4.11 Listing quality rules | todo | |
| Wave 4 merge | todo | |

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
