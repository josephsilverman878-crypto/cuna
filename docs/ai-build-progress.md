# Cuna's assistant (AI) — build progress

Started 2026-11-17. This file is the record of the five-phase AI build: the
prompt it follows (copied word for word), the checklist, what is merged, and
what needs Joseph. It is updated and committed after every finished item.

## Where things stand (2026-11-18: the assistant is LIVE on hellocuna.com)

- **Live for everyone since 2026-11-18, about 4:00 pm New York time.** Joseph entered his authenticator code in Vercel; the redeploy of main `bbd5c9d` with the five flags went Ready. Production bundle `index-dnccTQjl.js`.
- **On in production:** `AI_ENABLED`, `VITE_AI_ENABLED`, `AI_ACTIONS_ENABLED`, `VITE_AI_ACTIONS_ENABLED`, `AI_WEB_SEARCH_ENABLED` (all `true`). No allowlist, so every feature is on, the poster assistant included. Allowances at their defaults: $0.50 signed in, $0.10 visitor, $5 a day for everyone.
- **Checked signed out on hellocuna.com right after go-live (the app's own browser, no session):** `/new-to-ny` is the guide; one request returned 4 neighborhoods with sources; the assistant label shows; the usage bar went 0% → 20% → 33%; a listing question was answered from Cuna, and the same question again came from the cache in 0.3 s without moving the bar; a farmers-market question came back "From the web, not from Cuna's data" with its page linked; a safety question was refused with no search; the poster tools answer "Sign in to use the posting tools" to a visitor; 0 console errors.
- **The database recorded it** (read-only query, `51-ai-usage-today.sql`): 8 rows, total $0.0333, of which web search $0.0100 (1 search), 1 visitor, 0 rows left open, 6 answers cached. $0.0333 of a $0.10 allowance is the 33% the bar showed. This was the first real run of the allowance, the cache and the usage log.
- **Still needs Joseph's sign-in (NJ-A8):** the feed's search box and assistant panel, the tour-request confirmation card, the poster tools on the real pages, and the admin AI tab. None of these could be opened without an account.
- **To switch it off:** remove (or set to anything but `true`) `AI_ENABLED` and `VITE_AI_ENABLED` for Production in Vercel and redeploy; the redeploy asks for Joseph's authenticator code. Joseph has said switching off is allowed at once if anything breaks.
- **Exact next item:** Joseph runs the sign-in checklist (NJ-A8). Then watch the admin AI tab for a few days: cost by feature against the $5 cap, and how often visitors reach 100% (one guide answer is about 20% of a visitor's day).

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

## The go-live prompt (2026-11-18, copied verbatim)

```text
I want the AI live on hellocuna.com for everyone, today. This message is my explicit command to turn on the AI production flags, following the steps below. Same rules as docs/ai-build-progress.md unless this message says otherwise.

=== 1. POSTER ASSISTANT (build first) ===
a. "Fill from notes" on Post Listing: the poster pastes raw notes (an email, a text, a list); the AI fills the form fields (address, unit, price, beds, baths, sqft, FARE fee fields, amenities, pets policy, listing type rent/sale and sale fields, months free, lease term) using only what's in the notes. Every filled field is highlighted for review; nothing saves automatically; fields the notes don't mention stay empty, never guessed.
b. "Listing checkup" before submit on Post and Edit: lists what's missing or weak (fewer than 3 photos, missing FARE fields, missing sqft, price far from neighborhood norms, wording that fails fairHousing.js), with one-tap fixes where possible.
c. "Posting help": a help box in the poster dashboard that answers posting questions from the /help content and the app's own rules; if the answer isn't there, point to hello@hellocuna.com.
d. Keep the existing "Draft description."

=== 2. USAGE ALLOWANCE (replaces the request limits) ===
Replace the per-user and per-IP request limits with a daily AI usage allowance measured in estimated cost, calculated from each call's input tokens, output tokens and web searches at current prices (keep prices in the one config file):
- $0.50 per signed-in user per day, $0.10 per logged-out visitor per day, set by env vars.
- Show users a small usage bar with a percentage ("40% of today's AI used") in the AI panel and the poster assistant. Never show dollar amounts to users.
- At 80%, a gentle note. At 100%, a friendly "You've used today's AI. It resets at midnight." message. Resets at midnight New York time.
- Cached answers cost nothing and don't move the bar.
- Replace AI_DAILY_REQUEST_CAP with a global AI_DAILY_COST_CAP, default $5. If it's hit, AI pauses for everyone with a friendly message until midnight, and the admin AI tab shows it.
- Admin AI tab: cost per day and per feature, web-search cost shown separately, cache hit rate, number of users who hit 100%.

=== 3. WEB SEARCH ON ===
Turn web search on, with the rules as built: Cuna's database first; search only when our data doesn't cover the question; cite and link every web source; never store web content; never fetch StreetEasy pages directly or scrape any site.

=== 4. POLICY ===
If the AI privacy/terms update isn't merged yet, show me its full text in chat and wait for my "approved" before step 6. It must cover: what's sent to the AI provider; that pasted notes in "Fill from notes" are sent to the AI provider and not stored; that some answers use web search, the question is sent to the search provider, and web results are linked, not stored; that conversation text isn't kept long-term; the daily usage allowance; consented actions (tour requests and saves happen only after the user taps to confirm); and that recommendations come from Cuna's listings and public data.

=== 5. BUILD, TEST, MERGE ===
Do steps 1–3 on a branch. PR, preview with all AI flags on for Preview, run the smoke checklist on the preview (note steps that need my sign-in), squash-merge, verify the production commit, per the merge rules in docs/ai-build-progress.md.

=== 6. GO LIVE ===
After the policy is merged, turn on for Production in Vercel: AI_ENABLED, VITE_AI_ENABLED, AI_ACTIONS_ENABLED, VITE_AI_ACTIONS_ENABLED, AI_WEB_SEARCH_ENABLED, and any poster-assistant flags. If Vercel asks for my authenticator code or any other security check, stop and tell me. Don't work around it. Then redeploy main.

=== 7. VERIFY ON hellocuna.com ===
Confirm the production commit and bundle. Signed out, check: the neighborhood guide at /new-to-ny returns real results with sources; the plain-English search box works; the assistant label shows; the usage bar appears and moves; a question our data can't answer uses web search and links its source; the admin AI tab records usage and cost.
Then give me a smoke checklist of at most 8 steps for what needs my sign-in:
- Renter: ask about a listing; save a search from the guide; AI tour request with the confirmation card.
- Poster: fill from notes; listing checkup; draft description; posting help.
- Admin: AI tab shows cost by feature.

=== 8. IF SOMETHING BREAKS ===
If anything breaks on production, turn the AI flags back off right away (that's allowed), confirm the site works, and tell me.

When done, update docs/ai-build-progress.md and give me a short summary: what's live, the flags and their state, cost so far today, and anything that needs me.
```

## Needs Joseph

### NJ-A10 · Authenticator code in Vercel — resolved 2026-11-18
Vercel asked for Joseph's 6-digit code before it would redeploy to
Production. The work stopped there; he entered it himself; the redeploy ran.
Expect the same box for any future manual Production redeploy (for example
when switching the assistant off). Deployments made by merging into main do
not ask.

### NJ-A6 · Policy text (PR #39) — resolved 2026-11-18: Joseph replied "Approved"; merged as `bbd5c9d`
Privacy 8F and Terms 6A were rewritten on 2026-11-18 for the poster assistant,
web search and the usage allowance, and shown to Joseph in full in chat. The
PR is [#39](https://github.com/josephsilverman878-crypto/cuna/pull/39), head
`13f91cd`, not merged. Three points to check are listed in the PR (the
sentence about the AI provider not training on content; the account ID in the
usage record; the 30-day cache). On "approved" it is merged and the production
flags go on (his go-live prompt, steps 4 and 6).

### NJ-A8 · Things only your sign-in can check on hellocuna.com (given in chat 2026-11-18)
Each was checked as far as possible without an account: real model calls on
the preview and on production, and every new screen at 375 px on a local
page with sample data. Steps 2, 3 and 4 write real rows for the test accounts.
1. **Renter** → a listing page → Ask about this listing.
2. **Renter** → /new-to-ny → run the guide → Save this search.
3. **Renter** → /feed → Ask Cuna's assistant for suggestions → Request a tour → the confirmation card.
4. **Poster** → Post listing → Fill from notes → the outlined fields.
5. **Poster** → Post listing → Review → Listing checkup; and Draft description on Details.
6. **Poster** → dashboard → Posting help.
7. **Admin** → /admin → AI → cost by feature, today's total against the cap.
8. **Anyone** → the usage bar moves after an answer and never shows an amount.

### NJ-A9 · Stray duplicate files in the project's git folder (information, nothing to do now)
On 2026-11-18 three files with names ending in " 2" appeared inside `.git`
(`refs/heads/docs/ai-policy-update 2`, the same under `refs/remotes/origin`,
and `index 2.lock`). That is the pattern macOS makes when a synced folder
(iCloud Desktop and Documents) sees the same file change in two places; it
made `git pull` fail with "bad object". They were moved, not deleted, to
`cuna-security/git-strays-2026-11-18/`; the real branch pointers are intact
and main is in step with GitHub. If Desktop is synced to iCloud, moving the
project folder out of the synced area would stop this recurring. Joseph's
call; nothing was changed in his settings.

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

### NJ-A5 · Things only your sign-in can check on a preview (superseded by NJ-A8 once the flags are on)
Each was checked as far as possible without an account (real model calls
through the API, and the screens on a local page at 375 px with sample data).
Open the newest preview from Vercel → Deployments, sign in, and look at:
1. **Admin** → /admin → **AI**: the usage cards (empty on a preview until NJ-A3), **Run health check**, **Ask a test question**, and **Neighborhood write-ups**: **Write** one, open that neighborhood's page and see the block with its sources, then **Hide** it and see it gone. A write-up saved from a preview is saved in the real database, and shows on hellocuna.com only once the `writeup` feature is switched on there.
2. **Renter** → /new-to-ny: run the guide, tap **See listings** on a result, tap **Save this search**.
3. **Renter** → /feed: the search box ("2 bed under $4,000 in Astoria, dishwasher" → chips → Show listings) and **Ask Cuna's assistant for suggestions**.
4. **Renter** → Profile: "What the assistant did for you" (after confirming one action, for example **Save this search** from the assistant panel).
5. **Poster** → Post listing → **Draft description** → **Use this draft**.

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

### NJ-A4 · Turning the assistant on in production — commanded 2026-11-18, waiting on NJ-A6
Joseph's go-live prompt (above) is the explicit command; it is carried out
once the policy PR is merged. The steps below are kept for switching one
feature at a time later, and for switching everything off (step 4).
Every AI flag is OFF in production until then.
0. First: the policy PR merged (NJ-A6). 49-ai.sql is applied (2026-11-17).
1. Admin tab only: in Vercel → cuna → Settings → Environment Variables, for **Production**, add `AI_ENABLED=true`, `VITE_AI_ENABLED=true`, `AI_FEATURES=admin`, `VITE_AI_FEATURES=admin` → Deployments → Redeploy. Sign in as admin → /admin → **AI** → **Run health check**. Every line should read Works / Reachable / Working. Users still see nothing.
2. Then widen both lists one feature at a time. Names: `guide`, `search`, `listing_qa`, `draft`, `writeup`, `recommend`, `poster` (for example `admin,guide`), or remove both `*_FEATURES` variables to allow everything.
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
| `AI_ENABLED` | server | **`true`, live since 2026-11-18** | `true` (added 2026-11-17) | Kill switch for /api/ai |
| `VITE_AI_ENABLED` | browser | **`true`, live since 2026-11-18** | `true` (added 2026-11-17) | Kill switch for every AI surface |
| `AI_FEATURES` / `VITE_AI_FEATURES` | both | unset | unset | Optional allowlist, e.g. `admin,guide` |
| `AI_ACTIONS_ENABLED` / `VITE_AI_ACTIONS_ENABLED` | both | **`true`, live since 2026-11-18** | `true` (added 2026-11-17) | Consented actions (phase 5) |
| `AI_WEB_SEARCH_ENABLED` | server | **`true`, live since 2026-11-18** | `true` (added 2026-11-18) | Lets "Ask about this listing" search the web when Cuna's data has no answer |
| `AI_USER_DAILY_ALLOWANCE` | server | unset (0.50) | unset (0.50) | Estimated dollars a signed-in user may use per New York day |
| `AI_VISITOR_DAILY_ALLOWANCE` | server | unset (0.10) | unset (0.10) | The same for a logged-out visitor |
| `AI_DAILY_COST_CAP` | server | unset (5) | unset (5) | Estimated dollars for everyone per day; at the cap the assistant pauses until midnight New York time. Replaces `AI_DAILY_REQUEST_CAP`, which is no longer read |

The poster assistant has no flag of its own: it is on when `AI_ENABLED` and
`VITE_AI_ENABLED` are on, and can be limited with the allowlist name `poster`.

## Database changes

| Script | State | What |
|---|---|---|
| `49-ai.sql` | **APPLIED 2026-11-17** (backup taken the same day; test 57 checks, 0 FAIL, rolled back; read-only verify after) | `ai_usage`, `ai_cache`, `ai_take_slot()`, `admin_ai_usage()`, `neighborhood_writeups` + 3 admin functions, `ai_actions`. Additive only. Test: `49-ai-test.sql` (cannot be re-run now: it creates the same tables). Check: `49-ai-verify.sql` (read-only). Reverse: `49-ai-rollback.sql` (drops the four tables; not run, and only on Joseph's command). Results: `49-ai-results-2026-11-17.txt`. All in `cuna-security/` |

| `50-ai-allowance.sql` | **APPLIED 2026-11-18** (backup `backups/2026-11-18/` taken the same day: 28 tables, 352,297 bytes; test 49 checks, 0 FAIL, rolled back; read-only verify after; no Supabase warning box for any of it) | Two columns on `ai_usage` (`web_searches`, `search_cost_usd`) and four functions: `ai_begin()` (allowance and global cap, service role only), `ai_spent()` (service role only), `admin_ai_costs()`, `admin_ai_days()` (admins only). Additive only; `ai_take_slot()` and `admin_ai_usage()` from 49 are left in place, unused. Test: `50-ai-allowance-test.sql` (cannot be re-run now: its guard stops when the columns exist). Check: `50-ai-allowance-verify.sql` (read-only). Reverse: `50-ai-allowance-rollback.sql` (not run; only on Joseph's command, and only with `AI_ENABLED` off first). Results: `50-ai-allowance-results-2026-11-18.txt`. All in `cuna-security/` |

## Merge log

| Date | PR | Phase | main SHA | Preview smoke | Production spot-check |
|---|---|---|---|---|---|
| 2026-11-17 | [#34](https://github.com/josephsilverman878-crypto/cuna/pull/34) | 1 foundation | `c93e953` | Preview `1a8330d`: health ok (key works, both models reachable), real test question answered correctly in 2.7 s, 10 answers then the friendly limit message, unknown feature refused, key never in a response or the bundle, pages load with 0 console errors. Admin tab at 375 px checked on a local page with sample numbers (the preview needs Joseph's admin sign-in). Tables not covered: 49-ai.sql not applied | Production deployment `c93e953` Ready. hellocuna.com home, /feed, /neighborhoods/astoria, /listing/:id: 0 console errors, unchanged. `/api/ai` answers "disabled"; health shows only `ai_enabled: false`; no key name in the bundle |
| 2026-11-17 | [#35](https://github.com/josephsilverman878-crypto/cuna/pull/35) | 2 neighborhood guide | `c1d0256` | Preview `951acc5`, real model: rent request → 5 real Cuna neighborhoods in 8 s, destination resolved to Grand Central station, every figure with source and as-of; buy request → Queens / Brooklyn only, Department of Finance figures; follow-up updated the criteria; "who lives there / is it safe" → the refusal line and no picks; guide page, classic quiz and home with 0 console errors. Signed-in "See listings" and "Save this search" need Joseph's sign-in. Two bugs found and fixed before merge (destination lookup, buy mode on areas with a missing figure) | Production deployment `c1d0256` Ready. hellocuna.com `/new-to-ny` is the classic quiz (no guide, no assistant label), home, /feed and /listing/:id unchanged, 0 console errors; `/api/ai` answers "disabled" |
| 2026-11-17 | [#36](https://github.com/josephsilverman878-crypto/cuna/pull/36) | 3 write-ups and drafts | `cdb7580` | Preview `0878222`, real model: rental draft in 2.3 s and co-op sale draft in 1.9 s, only the form's numbers, no fallback; too few fields → asks for more with no model call; write-up request signed out → "Admins only"; stored write-up read → null; neighborhood page 0 console errors. Draft button and admin write-up panel checked on a local page at 375 px with sample data (the preview needs Joseph's poster / admin sign-in; saving a write-up needs 49-ai.sql). One fix before merge: drafts no longer end with an invented closing line | Production deployment `cdb7580` Ready. hellocuna.com /neighborhoods/astoria makes no assistant call and shows no write-up; home, /feed, /listing/:id unchanged, 0 console errors; `/api/ai` answers "disabled" |
| 2026-11-17 | [#37](https://github.com/josephsilverman878-crypto/cuna/pull/37) | 4 search and listing Q&A | `1d763ed` | Preview `ffe24ac`, real model: search line → only the asked filters (price, beds, dishwasher, cats; Astoria + both Bushwick parts; rent/buy not assumed; "near the N train" reported as not searchable); "cheapest studios for sale" → sale, studio, price low to high; a search about who lives somewhere → refusal. Listing question answered from the listing ($2,900, fees, pets); build year / nearest subway → "I don't have that for this listing" with Ask the agent; safety → refusal. Question box works in the real listing page, 0 console errors. Feed search box checked on a local page at 375 px (the feed needs Joseph's renter sign-in) | Production deployment `1d763ed` Ready. hellocuna.com listing page has no question box and makes no assistant call; /feed has no search box; home unchanged; 0 console errors; `/api/ai` answers "disabled" |
| 2026-11-17 | [#38](https://github.com/josephsilverman878-crypto/cuna/pull/38) | 5 recommendations and actions | `6ab97a0` | Preview `61be6e1`: health shows actions on; a normal request read into the right filters and, with 0 active listings today, answered "No active listings on Cuna match that right now"; a request about who lives somewhere → refusal; "save listing … and book me a tour" → no action, reported as not searchable. Panel, confirmation cards and activity list checked on a local page at 375 px with a stand-in database (nothing written before Confirm). Not run for real: Sonnet choosing among real listings (NJ-A7) | Production deployment `6ab97a0` Ready. hellocuna.com /feed has no assistant button or search box and makes no assistant call; Profile has no activity card; listing page and home unchanged; 0 console errors; `/api/ai` answers "disabled" |

| 2026-11-18 | [#42](https://github.com/josephsilverman878-crypto/cuna/pull/42) | 6 poster assistant, allowance, web search | `317565b` | Preview `4a9f475` (web search on for Preview), real model, no sign-in: health ok (key works, both models reachable, web search on, allowance 0.50 / 0.10 / 5). Fill from notes: 15 of 15 fields right on a messy rental note, "no elevator" and "gym around the corner" not ticked, a date without a year left empty; a sale note read as sale, condo, $1.25m. Posting help: photos, deposit cap and "can I delete a listing" answered from the help text; "pay to feature" → hello@hellocuna.com; a screening question refused. Wording fix removed "no kids" and "safe". Listing question: rent answered from Cuna with no search; a farmers-market question answered "From the web" in two sentences with two linked pages; a safety question refused with no search. Usage bar 0% → 27% over the run; guide page bar 0% → 20% after one answer. 0 console errors. New screens checked at 375 px on a local page with sample data. Not run: anything behind a sign-in; the real tables (previews count in memory) | Production deployment `317565b` Ready. hellocuna.com listing page: no question box, no usage bar; `/new-to-ny` is the classic quiz; feed unchanged; `/api/ai` health `ai_enabled: false`, usage and POST answer "disabled"; 0 console errors |

| 2026-11-18 | [#39](https://github.com/josephsilverman878-crypto/cuna/pull/39) | policy text | `bbd5c9d` | Text shown to Joseph in full in chat; he replied "Approved" | Production deployment `bbd5c9d` Ready with the flags still off; Privacy 8F and Terms 6A on hellocuna.com, dated November 18, 2026 |
| 2026-11-18 | Vercel redeploy of `bbd5c9d` (no code change) | **go-live** | `bbd5c9d` | n/a | Flags on. Signed out on hellocuna.com: guide with sources, label, usage bar 0% → 20% → 33%, cache hit without moving the bar, a web answer with its link, a safety question refused, poster tools refused to a visitor, 0 console errors. Database: 8 rows, $0.0333, 1 search |

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

### Phase 6 — poster assistant, usage allowance, web search (branch `feature/ai-6-poster-assistant`)

| Item | State | Notes |
|---|---|---|
| 6.1a Fill from notes | done (needs a poster sign-in to see on the live site) | `api/_ai-fill.js` + `FillFromNotes.jsx` + `src/lib/fillFromNotes.js` on Post listing. Haiku returns each field with the exact words of the notes it came from; the server keeps a value only if the quote is in the notes and the value is in the quote. Filled fields are outlined on every step (a dot marks the steps that hold one); a field the poster typed is never overwritten and is listed as "left as you typed it"; Undo restores the form. A broker fee is never filled in. A date is filled only when the notes give the year. Notes are never cached or logged |
| 6.1b Listing checkup | done | `src/lib/listingCheckup.js` (plain rules, no model call) + `ListingCheckup.jsx` on the Review step of Post and Edit: photos, FARE fee fields, deposit cap, price outside the form's range, price far from the area's reference range (with its source), fair-housing wording, pets policy, bad video / 3D links, missing sq ft and description. One-tap fixes: set a blank fee to $0, set the deposit to one month, clear a bad link, open the right step. "Rewrite without it" calls `api/_ai-checkup.js` (Sonnet): the rewrite must pass the scan and use only the original's numbers, one redo, then the sentences are removed by code |
| 6.1c Posting help | done | `api/_ai-help.js` + `PostingHelp.jsx` on the poster dashboard. Answers only from `src/lib/helpContent.js` (the Help page's own text, now shared) and `POSTING_RULES` in the handler; otherwise "write to hello@hellocuna.com". No web search. Cached 7 days |
| 6.1d Draft description kept | done | Unchanged |
| 6.2 Usage allowance | done; **ran against the real tables at go-live** (bar and database agree: $0.0333 of $0.10 is 33%) | `api/_ai-config.js` (`allowance`, `usageView`, web-search price), `api/_ai-store.js`, `ai_begin()` / `ai_spent()` in the database. `/api/ai` sends `usage: { percent, level, paused }` with every answer and at `GET ?feature=usage`. `AiUsage.jsx` inside `AiLabel` shows "40% of today's AI used": a note at 80%, the "used today's AI" line at 100%, never an amount. A request still in flight is counted at 3 cents so a burst cannot run far past an allowance |
| 6.2 Admin AI tab | done (needs Joseph's admin sign-in to see) | Today against the cap and whether it is paused; cost, the web-search part, cache hit rate, people who reached 100%; cost by feature and by day |
| 6.3 Web search | done | Only in "Ask about this listing", only after Cuna's data had no answer and the question is not one to decline. One search per answer, no page fetching, no redo. The answer shows at most three sentences, only sentences that rest on a cited passage, each with its page linked; a piece that merely repeats the source's wording is dropped. Marked "From the web, not from Cuna's data". Never cached. If nothing usable comes back, the plain "I don't have that for this listing" stands |
| Phase 6 merge | done | PR #42 → main `317565b`, live 2026-11-18 with every AI flag off in production |

### Policy update

| Item | State | Notes |
|---|---|---|
| Privacy.jsx and Terms.jsx draft in its own PR | done, approved and merged | [#39](https://github.com/josephsilverman878-crypto/cuna/pull/39): Privacy 8F "Cuna's assistant (AI features)" + Anthropic in the provider list; Terms 6A "Cuna's Assistant". Rewritten 2026-11-18 (head `13f91cd`) to cover notes pasted into Fill from notes, web search, and the daily usage allowance. **Merged 2026-11-18 as `bbd5c9d`** after Joseph's "Approved"; both sections confirmed on hellocuna.com |

## Cost estimate

Estimates from the size of each request and the published prices (per million
tokens, checked on Anthropic's price list 2026-11-18: Haiku 5.5 $0.10 in /
$0.50 out; Sonnet 5.5 $2 in / $10 out; web search $10 per 1,000 searches).
The figures below were measured on previews from the usage bar, and the
first production rows on 2026-11-18 agree with them (guide $0.0205 for its
two calls, a web answer $0.0122, a listing answer or a search about $0.0003).
The admin AI tab shows the running figures.

| Feature | Model | Est. cost each | Share of a visitor's day ($0.10) |
|---|---|---|---|
| Neighborhood guide (one answer) | Haiku + Sonnet | about 2 cents | about 20% |
| Ask about this listing, answered from Cuna | Haiku | about 0.05 cents | under 1% |
| Ask about this listing, answered from the web | Haiku + 1 search | about 1.1 cents | about 11% |
| Listing suggestions | Haiku + Sonnet | about 1 cent (not run with real listings) | about 10% |
| Plain-English search | Haiku | about 0.03 cents | under 1% |
| Fill from notes | Haiku | about 0.1 cents | signed in: under 1% of $0.50 |
| Listing checkup wording fix | Sonnet | about 0.3 cents | signed in: under 1% |
| Posting help | Haiku | about 0.1 cents | signed in: under 1% |
| Description draft | Sonnet | about 0.4 cents | signed in: about 1% |
| Neighborhood write-up (admin) | Sonnet | about 0.6 cents | not counted against a person |

**Per person:** a signed-in user can use at most about $0.50 a day and a
logged-out visitor about $0.10 (one request can run slightly past the line,
because the cost is only known after the answer).

**Ceiling:** `AI_DAILY_COST_CAP`, default **$5 a day** for everyone together.
At the cap the assistant pauses until midnight New York time and the admin
tab says so. A month at the cap every day would be about $150.

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
- 2026-11-18 — Web search was only plumbing until today: no feature asked for
  it, so switching the flag on would have done nothing. It is now wired into
  "Ask about this listing" and nowhere else.
- 2026-11-18 — The poster tools need a signed-in person in production. On a
  preview (behind Vercel login) they can be tried without an account, the
  same rule as the admin test question; that is how they were tested with the
  real model.
- 2026-11-18 — How Haiku writes a web answer: its own sentence, then the
  source's wording as the cited piece. The pipeline drops a cited piece that
  only repeats its passage and keeps the link; the listing handler then keeps
  only sentences that share words or numbers with a cited passage. A good
  search sometimes yields no usable sentence; the answer is then the ordinary
  "I don't have that for this listing" and the search (about 1 cent) is spent.
- 2026-11-18 — The 50 test script creates no table of its own (its report is
  kept in a transaction-local setting), so Supabase raised no warning box.
- 2026-11-18 — Joseph's Chrome is signed in to hellocuna.com as a renter, so
  signed-out checks of the live site are done in the app's own browser pane,
  which has no session. Nothing is ever signed out in his Chrome.
- 2026-11-18 — `git fsck` hung for minutes on this folder and stray " 2" files
  appeared in `.git` (see NJ-A9): both point to the Desktop being a synced
  folder.
- 2026-11-18 — Vercel: adding new Production variables raised no prompt;
  **redeploying to Production asks for the authenticator code** ("Verify Your
  Identity"). That is Joseph's to enter. While the flags are stored but not
  deployed, a merge to main would deploy them: hold every merge until the
  go-live deployment is done and checked.
- 2026-11-18 — Go-live: the redeploy picked the flags up at once; the first
  signed-out guide request on production exercised `ai_begin`, the row
  update with the new columns, `ai_spent` and the cache, all without error.
