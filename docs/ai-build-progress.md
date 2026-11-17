# Cuna's assistant (AI) — build progress

Started 2026-11-17. This file is the record of the five-phase AI build: the
prompt it follows (copied word for word), the checklist, what is merged, and
what needs Joseph. It is updated and committed after every finished item.

## Where things stand (2026-11-17, end of session)

- **Merged and live with every AI flag off in production:** phase 1 (#34), phase 2 (#35), phase 3 (#36), phase 4 (#37), phase 5 (#38). The code on main is `6ab97a0`; later merges on top of it are docs only. Users see no change.
- **Database:** `49-ai.sql` (the assistant's tables) was **applied 2026-11-17** after Joseph's "Yes, click it". Test first: 57 checks, 0 FAIL, rolled back. Four new empty tables; no existing table changed.
- **Open, waiting on Joseph:** the policy PR (#39), and the sign-in checks on a preview (NJ-A5).
- **Exact next item:** Joseph signs in on the newest preview and runs the NJ-A5 list, which can now include saving a write-up and the activity log. The limits, the answer cache and the usage log have still not run through the live app: that needs the service key on Preview (NJ-A3) or the admin-only switch-on in production (NJ-A4 step 1). Then the policy PR ("approved"), then production flags, which are Joseph's.

## The prompt (copied verbatim)

```text
You are building Cuna's AI assistant in five phases. Work through as much as you can in this session, phase by phase, without stopping for routine questions. Read CLAUDE.md, ~/Desktop/CUNA/cuna-security/HANDOFF.md and docs/audit-build-progress.md first and follow every rule in them, except where the permissions below explicitly expand them.

=== FIRST, ADD THIS RULE TO CLAUDE.md (commit it with phase 1) ===
"If a security check blocks an action (2FA or authenticator code, password re-entry, confirmation prompt, permission error), stop and ask Joseph. Do not find another route to the same result."

=== PERMISSIONS FOR THIS PROMPT ===
I explicitly allow you to:
- Create feature branches, commit, and push them.
- Open pull requests and SQUASH-MERGE them into main, which deploys to production on hellocuna.com, following the merge rules below.
- Run ADDITIVE SQL in Supabase (create table/column/index/function/policy), only after a backup export the way HANDOFF.md describes and a role-simulation test in the SQL editor ending in ROLLBACK. If your safety rules block a privilege-changing statement, write it out for me with click-by-click steps instead.

I do NOT allow, without my explicit command in chat:
- Any SQL that drops, deletes, truncates, renames, or rewrites existing data.
- Sending email to real people. On previews, send only to INQUIRY_TEST_RECIPIENT.
- Turning on any feature flag in production. Every AI feature ships with its production flag OFF. You may turn flags on for Preview only.
- Changing who is admin.
- Force-pushing to main or rewriting main's history.
- Committing any secret, or putting ANTHROPIC_API_KEY in any VITE_ variable or client code.

=== HOW TO WORK ===
1. Copy this entire prompt into the top of a new file docs/ai-build-progress.md, with a checklist (todo / in progress / done / blocked) and a "Needs Joseph" section. Update and commit it after every finished item. This file is how a new session resumes.
2. One branch per phase from the latest main: feature/ai-1-foundation, feature/ai-2-neighborhood-guide, feature/ai-3-writeups, feature/ai-4-search-qa, feature/ai-5-recommendations. Finish and merge a phase before starting the next.
3. If an item needs me, don't stop: mark it blocked, add the exact question or click-by-click steps to "Needs Joseph", and move on. Blocked items must not break a phase.
4. Before marking an item done: npm run build passes, no console errors, works at 375px, and all AI output passes src/lib/fairHousing.js.
5. MERGE RULES per phase: push and open a PR listing what was built, SQL applied, env vars needed, flags added, and a smoke checklist of at most 8 steps (flag steps that need my sign-in). Wait for the preview, verify its commit SHA, run the smoke checklist on the preview with the phase's flag on for Preview. Only if it passes, squash-merge. Verify the production SHA and spot-check hellocuna.com (home, feed, a listing page) to confirm nothing changed for users while the flag is off. If production breaks, revert immediately with a revert PR, confirm the site is healthy, then fix on a new branch. Log every merge in the progress file.
6. Mobile-first, existing brand (terracotta #C4714A, sand #F5F0E8, Cormorant Garamond + DM Sans), existing component patterns.

=== RULES FOR EVERY AI FEATURE ===
- Model calls happen only in server functions under /api, using ANTHROPIC_API_KEY (already in Vercel for Production and Preview). Use claude-haiku-5-5 for cheap, high-volume tasks (filter parsing, short Q&A) and claude-sonnet-5-5 for recommendations and write-ups. Put model names in one config file.
- Ground every answer in Cuna's database: listings, neighborhoods, DOF/ACRIS sales, schools, hospitals, subway stations, market data. Pass the relevant rows to the model; instruct it to answer only from them and say "I don't have that" otherwise. Never invent a listing, price, school or statistic.
- Every figure shown carries its source and "as of" date (e.g. "Source: NYC Department of Finance, as of Sept 2026"). When a figure is tied to a boundary, say which (Cuna's neighborhood boundary).
- Web search: build it behind AI_WEB_SEARCH_ENABLED (default off everywhere). When on, it may cite and link StreetEasy or other public pages for a specific answer, but never store their content and never fetch StreetEasy pages directly. No StreetEasy scraping anywhere.
- Fair housing: recommend only on criteria the user stated (price, size, commute, amenities, transit, schools by district if asked). Never infer or ask about race, religion, national origin, family status, disability, source of income, or other protected traits. Never describe areas as "safe", "good for families", "up and coming", or similar. Refuse demographic questions politely and offer criteria-based help instead. Run every output through fairHousing.js on the server; if it fails, regenerate once with a stricter instruction, then fall back to a neutral message.
- Label shown near every AI surface: "Cuna's assistant recommends neighborhoods in NYC and listings from Cuna based on what you share." Never call Cuna a broker or "not a broker".
- Limits: per signed-in user 30 AI requests/day, per IP for logged-out users 10/day, plus a global daily cap from env AI_DAILY_REQUEST_CAP (default 500). When a cap hits, show a friendly message, not an error.
- Cache: identical requests (same normalized input + same data version) return the stored answer without a model call. Stored write-ups are generated once and refreshed only on demand.
- Privacy: don't store conversation text long-term. Log only request counts, model, tokens, cost estimate and errors (no message content) in an ai_usage table. Ephemeral conversation state lives in the browser session.
- Kill switch: AI_ENABLED (server) and VITE_AI_ENABLED (client). When off, every AI surface disappears and the old quiz and search keep working.

=== PHASE 1: FOUNDATION ===
1.1 /api/ai shared helper: model call, timeout, retries, error handling, rate limits, cache, fair-housing post-check, usage logging.
1.2 Tables: ai_usage (no content), ai_cache (input hash, output, data version, created_at). RLS: service role only; admins may read ai_usage aggregates.
1.3 Admin: an "AI" tab in /admin showing requests and estimated cost per day and per feature, cache hit rate, and fair-housing regenerations.
1.4 A health-check endpoint that confirms the key works without exposing it.

=== PHASE 2: AI NEIGHBORHOOD GUIDE ===
2.1 New guide at /new-to-ny (keep the old quiz reachable at /new-to-ny/classic, and fall back to it when AI is off). Rent and buy paths.
2.2 User describes what they want in plain English (optional prompts: budget, bedrooms, commute destination, must-haves). The guide returns 3–5 neighborhoods from the neighborhoods table, each with plain reasons tied to the user's own criteria, key figures with sources, nearby subway lines, and a "See listings" button that opens the feed filtered to that neighborhood.
2.3 Follow-up refinement ("cheaper", "closer to downtown") within the session.
2.4 "Save this search": signed-in users save the criteria as a saved search (existing saved_searches), so they get alerts and the demand dashboard counts it. Logged-out users are prompted to sign in, then returned with their results intact.
2.5 Keep the existing quiz lead capture working.

=== PHASE 3: WRITE-UPS AND POSTER HELPER ===
3.1 Neighborhood write-ups: a short, factual summary for each neighborhood page, generated from our data only, stored in the database, shown with "Written by Cuna's assistant from public data" and sources. Admin can regenerate or hide any one.
3.2 Poster "Draft description" button on Post and Edit listing: writes a description only from the fields the poster entered; poster can edit it; it must pass the fair-housing scan before save, like any description.

=== PHASE 4: PLAIN-ENGLISH SEARCH AND Q&A ===
4.1 Search box in the feed: turns a sentence into the existing filters (price, beds, baths, sqft, neighborhoods, amenities, pets, rent/buy, near a subway line). Show the filters it applied as editable chips so the user can see and fix them. Never apply a filter the user didn't ask for.
4.2 "Ask about this listing" on listing pages: answers only from that listing's data, its building and neighborhood rows, and nearby subway. If the answer isn't in the data, say so and suggest "Ask the agent" (the existing question form).

=== PHASE 5: RECOMMENDATIONS AND CONSENTED ACTIONS ===
Build fully, ship with VITE_AI_ACTIONS_ENABLED and AI_ACTIONS_ENABLED off in production.
5.1 Assistant panel: the user describes what they want; it recommends matching Cuna listings (only real, active listings from the database), explains each match against the user's stated criteria, and refines from thumbs up/down.
5.2 Consented actions: save a listing, save a search, send a tour request. Each requires an explicit tap on a confirmation card that shows exactly what will happen (for a tour request: listing, agent, the renter's details that will be shared per their privacy toggles, message text). No action ever runs from chat text alone. Tour requests reuse /api/send-inquiry and its existing rate limits.
5.3 Activity log: the user can see every action the assistant took for them, in Profile.

=== POLICY UPDATE ===
Draft updates to Privacy.jsx and Terms.jsx covering the AI features (what's sent to the AI provider, what's logged, no long-term storage of conversation text, consented actions, that recommendations come from Cuna's listings and public data). Put the full text in its own PR and do NOT merge it until I reply "approved" in chat.

=== WHEN YOU STOP ===
Whether you finish or run out of room: update docs/ai-build-progress.md, commit and push the current branch, and give me a short summary: what's merged, which flags exist and their state, estimated cost per 100 users, the "Needs Joseph" list, and the exact next item.
```

## Needs Joseph

Nothing here breaks what is merged: production has every AI flag off.

### NJ-A2 · Supabase's "Potential issues detected" box — resolved 2026-11-17
Joseph answered "Yes, click it". What was done, each script in its own new
SQL tab, each pasted text checked against the file's sha256 before Run:
1. `49-ai-test.sql`: the box appeared ("Potential issue detected ... creates
   tables without enabling Row Level Security"); clicked **Run without RLS**.
   Result: `49-ai-test: 57 checks, 0 FAIL. ROLLED BACK.` (The script holds 57
   checks. The "58" written here earlier was a miscount; all 57 ran and passed.)
2. `49-ai.sql`: ran with **no box at all** this time. Result: `ai_usage`,
   `ai_cache`, `neighborhood_writeups`, `ai_actions` each 0 rows; three
   policies (two on `ai_actions`, one on `neighborhood_writeups`); none on
   `ai_usage` or `ai_cache`, as designed.
3. `49-ai-verify.sql` (read-only): RLS on all 4 tables, 5 functions, no grant
   to visitors or signed-in users on `ai_usage` / `ai_cache`, `ai_take_slot`
   callable by the service role only, 1 admin (unchanged). Row counts of the
   24 existing tables match the morning backup, except `listing_views` 5 → 9:
   four signed-out page views the site recorded at 19:25–19:30 UTC (2:25–2:30
   pm New York), about two and a half hours before this script ran. That is
   when the listing page was being opened for this build's page checks.
4. Through the live API with the public key (reads only): write-ups readable
   (0 rows), `updated_by` refused, `ai_usage`, `ai_cache`, `ai_actions` refused.
Full output: `cuna-security/49-ai-results-2026-11-17.txt`. The yes covered
this build's script only; a future script that raises the box is a new ask.

Limits of the method: the role simulation proves what each role can do under
RLS and grants. It does not prove the live app. Still not run through the
live app: the daily limits, the cache and the usage log (they need the
service key on a deployment with the flags on: NJ-A3 or NJ-A4 step 1), and
saving a write-up and the activity log (they need a sign-in: NJ-A5).

The original question, kept for the record:
When a script that creates tables or functions is run in the Supabase SQL
editor, Supabase shows a box titled "Potential issues detected" with the
buttons "Run and enable RLS", "Run without RLS" and "Cancel". Until now I
clicked "Run without RLS" (our scripts switch RLS on themselves). Under the new
rule ("If a security check blocks an action ... confirmation prompt ... stop
and ask Joseph") I did not click it this session.

Reply with one of:
- **"yes, click it"** — I run `49-ai-test.sql` (rolls back, changes nothing), then `49-ai.sql`, clicking "Run without RLS" each time, for this build's additive scripts only.
- **"I'll run it"** — steps for you: Supabase → SQL Editor → **+ New query** → paste the whole of `~/Desktop/CUNA/cuna-security/49-ai-test.sql` → **Run** → in the box choose **Run without RLS**. It must end in a red error that starts `49-ai-test: 58 checks, 0 FAIL. ROLLED BACK.` (the error is how the test undoes itself). Only if it says 0 FAIL: **+ New query** again → paste `~/Desktop/CUNA/cuna-security/49-ai.sql` → **Run** → **Run without RLS**. It ends with a small table (ai_usage rows 0, ai_cache rows 0, ...).

Already done for it: a read-only backup taken 2026-11-17 the HANDOFF way
(`cuna-security/backups/2026-11-17/`: row counts for 24 tables and a 351 KB
JSON dump, no password hashes or tokens; the two geometry columns of
`neighborhoods` are left out because 42-wave1-search.sql rebuilds them).
The script was applied the same day, so that backup is the one in force.

Previews still count limits in memory and cache and log nothing, because the
service key is in Vercel for Production only (NJ-A3).

### NJ-A5 · Things only your sign-in can check on a preview
Each was checked as far as possible without an account (real model calls
through the API, and the screens on a local page at 375 px with sample data).
Open the newest preview from Vercel → Deployments, sign in, and look at:
1. **Admin** → /admin → **AI**: the usage cards (empty on a preview until NJ-A3), **Run health check**, **Ask a test question**, and **Neighborhood write-ups**: **Write** one, open that neighborhood's page and see the block with its sources, then **Hide** it and see it gone. A write-up saved from a preview is saved in the real database, and shows on hellocuna.com only once the `writeup` feature is switched on there.
2. **Renter** → /new-to-ny: run the guide, tap **See listings** on a result, tap **Save this search**.
3. **Renter** → /feed: the search box ("2 bed under $4,000 in Astoria, dishwasher" → chips → Show listings) and **Ask Cuna's assistant for suggestions**.
4. **Renter** → Profile: "What the assistant did for you" (after confirming one action, for example **Save this search** from the assistant panel).
5. **Poster** → Post listing → **Draft description** → **Use this draft**.

### NJ-A6 · Policy text (PR #39): reply "approved" or send changes
Privacy 8F and Terms 6A are drafted in
[#39](https://github.com/josephsilverman878-crypto/cuna/pull/39) and are not
merged. Three things to check are listed in the PR (the sentence about the AI
provider not training on content; whether to keep the account ID in the usage
record; the 30-day cache). Merge it before turning any AI flag on in production.

### NJ-A7 · Listing suggestions have not picked from real listings yet
Production has no active listing today, so the last step of a recommendation
(Sonnet choosing among real listings) ran only against a stand-in model in the
tests. When at least one listing is active, try the assistant panel on a preview.

### NJ-A3 · Service key on Preview (optional; holds up: testing limits, cache and the usage log on previews)
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` exist in Vercel for Production
only. Without them a preview cannot write the usage log, so previews count
limits in memory, never cache, and show no usage in /admin. To test those on a
preview: Vercel → cuna → Settings → Environment Variables → open each of the
two → tick **Preview** as well → Save (Vercel will ask for your authenticator
code; that is yours to enter). The alternative is to leave it: those paths are
then proven by the role-simulation test and by the health check in production
with the flags still off for users.

### NJ-A4 · Turning the assistant on in production (yours, whenever you choose)
Every AI flag is OFF in production and stays off until you turn it on.
0. First: the policy PR merged (NJ-A6). 49-ai.sql is applied (2026-11-17).
1. Admin tab only: in Vercel → cuna → Settings → Environment Variables, for **Production**, add `AI_ENABLED=true`, `VITE_AI_ENABLED=true`, `AI_FEATURES=admin`, `VITE_AI_FEATURES=admin` → Deployments → Redeploy. Sign in as admin → /admin → **AI** → **Run health check**. Every line should read Works / Reachable / Working. Users still see nothing.
2. Then widen both lists one feature at a time. Names: `guide`, `search`, `listing_qa`, `draft`, `writeup`, `recommend` (for example `admin,guide`), or remove both `*_FEATURES` variables to allow everything.
3. The action buttons (save a listing, save a search, request a tour from the assistant) need two more: `AI_ACTIONS_ENABLED=true` and `VITE_AI_ACTIONS_ENABLED=true`.
4. To switch everything off again: set `AI_ENABLED` and `VITE_AI_ENABLED` to anything other than `true` and redeploy.

### NJ-A1 · Model key in Vercel — resolved
You added `ANTHROPIC_API_KEY` during this session for Production and Preview
(two entries; checked by name only). It must never go in a `VITE_` variable.

### Carried over from the audit build (unchanged)
NJ-1 (names for trimmed areas), NJ-2 (Mapbox token URL restriction), NJ-3
(Brooklyn splits), NJ-4 (transit commute provider), NJ-5 (XML feed questions),
NJ-6 (Google sign-in), NJ-7 (Apple sign-in): see `docs/audit-build-progress.md`.
NJ-4 matters here: the assistant describes commutes by straight-line distance
and shared subway lines, not by minutes on the train, until a provider is chosen.

## Flags

| Flag | Where | Production | Preview | What it does |
|---|---|---|---|---|
| `AI_ENABLED` | server | off (unset) | `true` (added 2026-11-17) | Kill switch for /api/ai |
| `VITE_AI_ENABLED` | browser | off (unset) | `true` (added 2026-11-17) | Kill switch for every AI surface |
| `AI_FEATURES` / `VITE_AI_FEATURES` | both | unset | unset | Optional allowlist, e.g. `admin,guide` |
| `AI_ACTIONS_ENABLED` / `VITE_AI_ACTIONS_ENABLED` | both | off (unset) | `true` (added 2026-11-17) | Consented actions (phase 5) |
| `AI_WEB_SEARCH_ENABLED` | server | off (unset) | off (unset) | Lets the assistant cite public web pages |
| `AI_DAILY_REQUEST_CAP` | server | unset (500) | unset (500) | Global requests per New York day |

## Database changes

| Script | State | What |
|---|---|---|
| `49-ai.sql` | **APPLIED 2026-11-17** (backup taken the same day; test 57 checks, 0 FAIL, rolled back; read-only verify after) | `ai_usage`, `ai_cache`, `ai_take_slot()`, `admin_ai_usage()`, `neighborhood_writeups` + 3 admin functions, `ai_actions`. Additive only. Test: `49-ai-test.sql` (cannot be re-run now: it creates the same tables). Check: `49-ai-verify.sql` (read-only). Reverse: `49-ai-rollback.sql` (drops the four tables; not run, and only on Joseph's command). Results: `49-ai-results-2026-11-17.txt`. All in `cuna-security/` |

## Merge log

| Date | PR | Phase | main SHA | Preview smoke | Production spot-check |
|---|---|---|---|---|---|
| 2026-11-17 | [#34](https://github.com/josephsilverman878-crypto/cuna/pull/34) | 1 foundation | `c93e953` | Preview `1a8330d`: health ok (key works, both models reachable), real test question answered correctly in 2.7 s, 10 answers then the friendly limit message, unknown feature refused, key never in a response or the bundle, pages load with 0 console errors. Admin tab at 375 px checked on a local page with sample numbers (the preview needs Joseph's admin sign-in). Tables not covered: 49-ai.sql not applied | Production deployment `c93e953` Ready. hellocuna.com home, /feed, /neighborhoods/astoria, /listing/:id: 0 console errors, unchanged. `/api/ai` answers "disabled"; health shows only `ai_enabled: false`; no key name in the bundle |
| 2026-11-17 | [#35](https://github.com/josephsilverman878-crypto/cuna/pull/35) | 2 neighborhood guide | `c1d0256` | Preview `951acc5`, real model: rent request → 5 real Cuna neighborhoods in 8 s, destination resolved to Grand Central station, every figure with source and as-of; buy request → Queens / Brooklyn only, Department of Finance figures; follow-up updated the criteria; "who lives there / is it safe" → the refusal line and no picks; guide page, classic quiz and home with 0 console errors. Signed-in "See listings" and "Save this search" need Joseph's sign-in. Two bugs found and fixed before merge (destination lookup, buy mode on areas with a missing figure) | Production deployment `c1d0256` Ready. hellocuna.com `/new-to-ny` is the classic quiz (no guide, no assistant label), home, /feed and /listing/:id unchanged, 0 console errors; `/api/ai` answers "disabled" |
| 2026-11-17 | [#36](https://github.com/josephsilverman878-crypto/cuna/pull/36) | 3 write-ups and drafts | `cdb7580` | Preview `0878222`, real model: rental draft in 2.3 s and co-op sale draft in 1.9 s, only the form's numbers, no fallback; too few fields → asks for more with no model call; write-up request signed out → "Admins only"; stored write-up read → null; neighborhood page 0 console errors. Draft button and admin write-up panel checked on a local page at 375 px with sample data (the preview needs Joseph's poster / admin sign-in; saving a write-up needs 49-ai.sql). One fix before merge: drafts no longer end with an invented closing line | Production deployment `cdb7580` Ready. hellocuna.com /neighborhoods/astoria makes no assistant call and shows no write-up; home, /feed, /listing/:id unchanged, 0 console errors; `/api/ai` answers "disabled" |
| 2026-11-17 | [#37](https://github.com/josephsilverman878-crypto/cuna/pull/37) | 4 search and listing Q&A | `1d763ed` | Preview `ffe24ac`, real model: search line → only the asked filters (price, beds, dishwasher, cats; Astoria + both Bushwick parts; rent/buy not assumed; "near the N train" reported as not searchable); "cheapest studios for sale" → sale, studio, price low to high; a search about who lives somewhere → refusal. Listing question answered from the listing ($2,900, fees, pets); build year / nearest subway → "I don't have that for this listing" with Ask the agent; safety → refusal. Question box works in the real listing page, 0 console errors. Feed search box checked on a local page at 375 px (the feed needs Joseph's renter sign-in) | Production deployment `1d763ed` Ready. hellocuna.com listing page has no question box and makes no assistant call; /feed has no search box; home unchanged; 0 console errors; `/api/ai` answers "disabled" |
| 2026-11-17 | [#38](https://github.com/josephsilverman878-crypto/cuna/pull/38) | 5 recommendations and actions | `6ab97a0` | Preview `61be6e1`: health shows actions on; a normal request read into the right filters and, with 0 active listings today, answered "No active listings on Cuna match that right now"; a request about who lives somewhere → refusal; "save listing … and book me a tour" → no action, reported as not searchable. Panel, confirmation cards and activity list checked on a local page at 375 px with a stand-in database (nothing written before Confirm). Not run for real: Sonnet choosing among real listings (NJ-A7) | Production deployment `6ab97a0` Ready. hellocuna.com /feed has no assistant button or search box and makes no assistant call; Profile has no activity card; listing page and home unchanged; 0 console errors; `/api/ai` answers "disabled" |

## Checklist

States: todo · in progress · done · blocked.

### Phase 1 — foundation (branch `feature/ai-1-foundation`)

| Item | State | Notes |
|---|---|---|
| Rule added to CLAUDE.md | done | Hard rules, plus a short "Cuna's assistant (AI)" section |
| 1.1 /api/ai shared helper | done | `api/ai.js` (one endpoint), `api/_ai.js` (pipeline: cache → limits → model → grounding + fair-housing check with one regeneration, then neutral fallback → log), `api/_ai-config.js` (models, prices, limits, house rules), `api/_ai-store.js` (who is asking, limits, cache, log), `api/_ai-registry.js`. 22 s per call, 1 retry, 60 s function limit. `npm run test:ai`: 16 tests, no network |
| 1.2 Tables ai_usage, ai_cache | done (applied 2026-11-17) | `49-ai.sql` applied after its rollback-only test (57 checks, 0 FAIL). Not yet exercised by the live app: no deployment has both the service key and the flags on (NJ-A3 / NJ-A4) |
| 1.3 Admin "AI" tab | done (needs Joseph's look on a preview) | `src/components/AdminAi.jsx` in /admin: requests and estimated cost per day and per feature, cache hit rate, fair-housing regenerations, health check, test question. Hidden unless `VITE_AI_ENABLED=true` |
| 1.4 Health check | done | `GET /api/ai?feature=health`: asks the provider about both models (no tokens, no cost), checks the tables; the key is never returned. Detail for admins only in production |
| Phase 1 merge | done | PR #34 → main `c93e953`, live 2026-11-17 with every AI flag off in production (see Merge log). 1.2 applied later the same day. Still open: Joseph's look at the admin tab on a preview |

### Phase 2 — AI neighborhood guide (branch `feature/ai-2-neighborhood-guide`)

| Item | State | Notes |
|---|---|---|
| 2.1 New guide at /new-to-ny, classic quiz at /new-to-ny/classic, rent and buy | done | `src/pages/NeighborhoodGuide.jsx`. `/new-to-ny` shows the guide only when `VITE_AI_ENABLED=true` (and `guide` is allowed); otherwise the classic quiz, exactly as before. The classic quiz is always at `/new-to-ny/classic`. Rent / Buy toggle. If the assistant cannot answer (off, limit, error) the page says so and links to the classic quiz |
| 2.2 Plain-English input → 3–5 neighborhoods with reasons, figures, subway, "See listings" | done | Server: `api/_ai-city.js` (grounding rows: Cuna boundaries, subway lines inside each, reference ranges with source / as-of / boundary, live Cuna listings), `api/_ai-guide.js` (Haiku reads the stated criteria; Sonnet picks from a server-built table of up to 36 candidates; the server attaches every figure, source and subway line; unknown neighborhoods, invented dollar amounts and travel times in minutes are rejected, one redo, then facts-only reasons written by code). Optional boxes: budget, bedrooms, where you need to get to, must-haves. "See listings" opens `/feed?hood=<id>&type=rent|sale` (neighborhood and rent/buy only). Price figures exist for the 30 reference areas (42 of Cuna's 209 neighborhoods); the rest say "Cuna does not hold a price figure" |
| 2.3 Follow-up refinement in the session | done | "Change something" box sends the earlier criteria and the neighborhoods already shown; state lives in sessionStorage only |
| 2.4 "Save this search" (sign-in returns with results intact) | done (signed-in save needs Joseph's sign-in to smoke) | Uses the existing `saved_searches` (price, bedrooms, the picked neighborhoods). Signed out: goes to sign-in with `next=/new-to-ny`; the results are restored from sessionStorage on return |
| 2.5 Existing quiz lead capture still works | done | The classic quiz and its results page are untouched; its "Take / retake the quiz" buttons point at `/new-to-ny/classic` while the guide holds `/new-to-ny` |
| Phase 2 merge | done | PR #35 → main `c1d0256`, live 2026-11-17 with every AI flag off in production (see Merge log) |

### Phase 3 — write-ups and drafts (branch `feature/ai-3-writeups`)

| Item | State | Notes |
|---|---|---|
| 3.1 Neighborhood write-ups (stored, labelled, admin regenerate / hide) | built; table applied 2026-11-17; first real save needs Joseph's admin sign-in (NJ-A5) | `api/_ai-writeup.js`: an admin asks for one neighborhood; the server gathers Cuna's facts for it (subway lines inside the boundary, reference figures, place notes, live listings), Sonnet writes 70 to 130 words, every number is checked against the facts, fair-housing scan, then saved through `admin_save_writeup()` (the database refuses non-admins). `GET /api/ai?feature=writeup&slug=` reads the stored, visible one; `NeighborhoodWriteup.jsx` shows it on `/neighborhoods/:slug` with "Written by Cuna's assistant from public data", the date and a Sources list. `AdminWriteups.jsx` in /admin → AI: Write / Rewrite / Hide / Show per neighborhood. Admin writing does not use the admin's own 30-a-day limit; the global cap still applies. Needs `49-ai.sql` (table `neighborhood_writeups`) before anything can be saved or shown |
| 3.2 Poster "Draft description" button | done (button needs a poster sign-in to see on the preview) | `api/_ai-draft.js` + `DraftDescription.jsx` on Post listing and Edit listing. Sends only fields the poster entered (never the street address). The draft may use a number only if the form holds it; fair-housing scan on the server; one redo, then a plain sentence built by code. The poster must tap "Use this draft"; the form's own fair-housing check still runs on save |
| Phase 3 merge | done | PR #36 → main `cdb7580`, live 2026-11-17 with every AI flag off in production (see Merge log). 49-ai.sql was applied later the same day, so 3.1 can store; not yet tried with a sign-in |

### Phase 4 — search and listing Q&A (branch `feature/ai-4-search-qa`)

| Item | State | Notes |
|---|---|---|
| 4.1 Plain-English search → editable filter chips | done (the feed needs a renter sign-in to see on the preview) | `api/_ai-search.js` + `SmartSearch.jsx` at the top of the feed. Haiku turns one line into the feed's existing filters (rent/buy, price, beds, baths, sq ft, amenities, pets, sort); neighborhood names are matched to Cuna's table in code ("Bushwick" selects both Bushwick parts). What it understood is shown as removable chips; "Show listings" applies exactly those, starting from empty filters. Anything the filters cannot express (a subway line, a commute) is listed as "not searchable here, so not applied" |
| 4.2 "Ask about this listing" | done | `api/_ai-listing-qa.js` + `AskAboutListing.jsx` on `/listing/:id`. Haiku answers from that listing's public row (price, fees, size, dates, pets, amenities, open houses, the agent's description), its Cuna neighborhood and the five nearest subway stations with the page's own estimated walks. Every number must be one of those facts (`api/_ai-check.js`); no other travel times. If the facts do not hold the answer: "I don't have that for this listing." with an **Ask the agent** button (the existing question form). The building's public records (PLUTO / DOB) are read in the browser by the Building page, not stored in Cuna's database, so they are not part of the facts yet |
| Phase 4 merge | done | PR #37 → main `1d763ed`, live 2026-11-17 with every AI flag off in production (see Merge log) |

### Phase 5 — recommendations and consented actions (branch `feature/ai-5-recommendations`)

| Item | State | Notes |
|---|---|---|
| 5.1 Assistant panel recommending real listings, thumbs up / down | done (the feed needs a renter sign-in to see on the preview; production has no active listings today) | `api/_ai-recommend.js` + `AssistantPanel.jsx` in the feed. Haiku reads the request into the feed's filters; the server takes the ACTIVE listings that match; Sonnet picks up to five by a short code and writes reasons; every number must be in that listing's line. The cards are built from Cuna's own rows, not from the model. Thumbs are kept for the visit only: a thumbs-down removes that listing from the next request, thumbs-up listings are shown to the model as "liked". No match → says so and offers the saved search |
| 5.2 Consented actions (confirmation card per action) | done (flags off in production) | Save listing and Save search each open a card saying what will happen and what is shared, and nothing is written until **Confirm**. Request a tour opens the existing Request a tour form (dates, what you share, message, Send), the one tour path, with its existing rate limits. The `/api/ai` server cannot act at all, so typed text ("save it for me") can never trigger anything. Shown only when `VITE_AI_ACTIONS_ENABLED` and `AI_ACTIONS_ENABLED` are both `true` |
| 5.3 Activity log in Profile | built; table applied 2026-11-17; first real row needs Joseph's renter sign-in (NJ-A5) | `src/lib/aiActions.js`, `AssistantActivity.jsx` in Profile ("What the assistant did for you"). A row is written to `ai_actions` after each confirmed action. The table is part of `49-ai.sql`; until it is applied the actions still work but nothing is logged or listed |
| Phase 5 merge (actions flags off in production) | done | PR #38 → main `6ab97a0`, live 2026-11-17 with every AI flag off in production. `AI_ACTIONS_ENABLED` and `VITE_AI_ACTIONS_ENABLED` are set for Preview only |

### Policy update

| Item | State | Notes |
|---|---|---|
| Privacy.jsx and Terms.jsx draft in its own PR | done (waiting for "approved") | [#39](https://github.com/josephsilverman878-crypto/cuna/pull/39): Privacy 8F "Cuna's assistant (AI features)" + Anthropic in the provider list; Terms 6A "Cuna's Assistant". Not merged |

## Cost estimate

These are estimates from the size of each request and the published prices
(per million tokens, checked 2026-11-17: Haiku 5.5 $0.10 in / $0.50 out;
Sonnet 5.5 $2 in / $10 out). They are NOT read from the usage log: the table
exists since 2026-11-17 but is empty until a deployment with the service key
runs the assistant. The admin AI tab will show real figures after that.

| Feature | Model | Time (measured on previews) | Est. cost each |
|---|---|---|---|
| Neighborhood guide (one answer) | Haiku + Sonnet | 6–11 s | about 2.5 cents |
| Listing suggestions | Haiku + Sonnet | not run with real listings | about 1 cent |
| Description draft | Sonnet | 2 s | about 0.4 cents |
| Neighborhood write-up | Sonnet | not run (admin + tables) | about 0.6 cents (about $1.25 for all 209) |
| Plain-English search | Haiku | 1–3 s | about 0.03 cents |
| Ask about this listing | Haiku | 1–3 s | about 0.03 cents |

**Per 100 active users:** about **$6**, assuming each runs the guide twice
(one follow-up), searches in plain English four times, asks three listing
questions and asks for suggestions once. The guide is nearly all of it.

**Ceiling:** the global cap (`AI_DAILY_REQUEST_CAP`, default 500 requests a
day) bounds a day at roughly **$15** even if every request were the most
expensive kind; one person is capped at 30 requests a day (10 signed out).
Repeated identical requests cost nothing once the cache table exists.

## Session notes

- 2026-11-17 — Sonnet calls are sent with Anthropic's server-side fallback
  switched on (`fallbacks: 'default'`): if Sonnet 5.5 declines a request, the
  provider retries it on the previous Sonnet inside the same call. Told to
  Joseph in chat. The usage log records which model actually answered.
- 2026-11-17 — A request answered from the cache does not use one of the
  person's daily requests (no model call is made); it is still logged, as a
  cache hit, so the hit rate can be shown.
- 2026-11-17 — Bugs found by smoke tests against the real model and fixed
  before their merges, each with a test: a destination name read as a street
  address (phase 2); buy mode failing on areas with a missing sale figure
  (phase 2); drafts ending with an invented closing line (phase 3); a number
  check that matched substrings (phase 4); answers saying "the facts" (phase 4).
- 2026-11-17 — Before 49-ai.sql was applied, confirming an action on a preview
  logged one "404" in the browser console (no activity table yet). The table
  exists now, so that no longer applies.
- 2026-11-17 — 49-ai.sql applied (see NJ-A2 for the full record). Two things
  to know next time: Supabase raised its "Potential issue detected" box for
  the test script but not for the apply script, and the test script cannot be
  re-run once the tables exist (use `49-ai-verify.sql`, which is read-only).
- 2026-11-17 — Opening a listing page records a row in `listing_views`, on
  previews too (they share the one database). Page checks therefore move that
  count; it is the site's own counter, not a script.
- 2026-11-17 — Commute: the guide gives straight-line miles from the middle of
  a neighborhood and the subway lines it shares with stations near the
  destination. It never states minutes (no transit provider yet: NJ-4). The
  destination text is looked up with NYC's public address search, the same
  service the commute calculator already uses.
- 2026-11-17 — The guide's second model call (Sonnet) never sees the person's
  own words, only the criteria read from them.
- 2026-11-17 — Account ids and IP addresses are not stored in `ai_usage` in
  readable form: the limit key is a keyed hash (the IP's changes daily).
