# Cuna

NYC rental marketing platform connecting renters with agents/landlords.
Positioning: "Cuna — where you belong." An easier, more renter-friendly
alternative to StreetEasy and Zillow — the next better version of how those
platforms should work. NOT "Tinder for apartments."

Discovery is moving from the swipe deck to an Instagram-style scroll-and-like
feed. That rewrite is the next major piece of work and has not started yet, so
SwipeDeck.jsx and SwipeHistory.jsx are still the live code paths — read them as
current, but do not build NEW features on top of the deck.

## Stack
React + Vite on Vercel · Supabase (Postgres + Auth + Storage) · Resend for email
Live: cuna-xi.vercel.app
Work happens on the `main` branch. Every push to main deploys to production.

## Architecture notes
- Two roles: `renter` and `poster`. Role is permanent once set.
- Two signup doors: /register (renter) and /register/pro (agent, collects NY DOS license)
- Posters cannot publish until `verified = true` (enforced by a DB trigger, not just UI)
- Admin approves posters at /admin (requires `is_admin` on profiles)
- There is NO match loop. A like (currently a swipe right) = private save.
  Contact happens via "Request a tour" which emails the agent through
  /api/send-inquiry
- /listing/:id is the canonical public listing view. It is what emails link to.
  Do not build duplicate listing detail views.
- Email is in test mode: INQUIRY_TEST_RECIPIENT redirects all mail to the owner
  until a real sending domain is verified with Resend.

## Tour requests and renter privacy
The whole tour-request path is ONE component: src/components/RequestTour.jsx.
All three "Request a tour" buttons (SwipeDeck.jsx, SwipeHistory.jsx,
ListingDetail.jsx) render it as a modal. It contains exactly one fetch() to /api/
and exactly one insert into `inquiries`. If you are changing what a broker sees,
that file is the only place to change. Don't go looking for a second code path.

api/send-inquiry.js only sends email. It has no Supabase client and cannot write
rows. It renders whatever the client hands it. So privacy filtering is a CLIENT
responsibility — the payload must be built already-filtered. Never "fix" a leak
by filtering server-side; the leak is whatever put the field in the payload.

Column names — these are the real ones, don't invent variants:
- renter_profiles has exactly FOUR boolean toggles:
  show_phone, show_move_in, show_pets, show_credit
  (there is no show_move_in_date and no show_credit_score)
- inquiries has FIVE shared_* snapshot columns:
  shared_phone, shared_move_in_date, shared_has_pets, shared_pet_details,
  shared_credit_score_range

Four toggles gate five fields, so the mapping is not 1:1 — show_pets gates BOTH
shared_has_pets and shared_pet_details. The inquiries row is a snapshot of what
was shared at send time, deliberately not a live view of current settings.

## Hard rules
- Never use a VITE_ prefix for secrets. Vite bakes those into the browser bundle.
  Server-side keys go in Vercel env vars and are read only inside /api/ functions.
- FARE Act: listings must disclose all fees. No tenant-paid broker fee option
  exists or should be added.
- Fair housing: listing descriptions must not state preferences about tenants.
- You have no database access. The anon key in .env.local cannot run migrations or
  admin queries. When a change needs SQL, write the SQL and hand it to Joseph to run
  in the Supabase SQL editor — don't attempt it via curl or the REST API.
- When writing that SQL: `auth.uid()` is NULL in the Supabase SQL editor. Joseph is
  connected as `postgres`, not as an authenticated user, so any `where id = auth.uid()`
  silently returns zero rows. Filter by an explicit id, or order by `updated_at` /
  `created_at` and take the most recent rows.
- Say what the diff is before pushing. Every push to main deploys to production.

## Debugging lesson
Failures in this project are usually SILENT: a missing RLS policy returning zero
rows, a field quietly dropped from an insert, a stale deploy. When something shows
no results, check the database directly before assuming the UI is wrong. Confirm
Vercel says "Ready" before testing.

A specific shape of this to watch for: an await whose error is logged but never
rethrown, sitting inside a try that then sets a success state. The user sees
"Request sent" while the write silently failed. RequestTour.jsx's `inquiries`
insert still does this on purpose — the email has already gone out by then, so
failing the whole action would be a lie in the other direction. But it means a
successful-looking tour request does NOT prove the row was written. Check the
table.

Read the actual file before answering questions about behavior. Reasoning about
what the code probably does is what made the privacy-toggle debug take as long
as it did; reading it is what ended it.

## Verify the deployed commit before trusting any test
Every push to main triggers a Vercel deploy. Before drawing ANY conclusion from a
live test, confirm the deployed SHA matches the commit under test:

1. `git rev-parse --short HEAD` locally, and `git status` to confirm it is pushed.
2. Vercel → Deployments: the top entry must say "Ready" AND show that SHA.
   "Building" or "Queued" means you are testing the PREVIOUS commit.
3. Hard-reload the tab (Cmd+Shift+R). A cached bundle is a stale client even when
   the deploy is current.
4. /api/ functions ship on the same commit but are invoked and logged separately.
   If only the API changed, check the function log timestamp too.

If the SHA does not match, the test result is not evidence of anything. Say so and
re-test rather than reasoning about the result.

Stale-deploy ambiguity cost days on the privacy-toggle bug: the frontend was
current, the emails being read were old, and every conclusion drawn from them was
wrong.
