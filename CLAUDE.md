# Cuna

NYC rental marketing platform connecting renters with agents/landlords.
Positioning: "cuna — find your perfect place." A better StreetEasy, differentiated
by engaging discovery (swipe deck, quick browsing). NOT "Tinder for apartments."

## Stack
React + Vite on Vercel · Supabase (Postgres + Auth + Storage) · Resend for email
Live: cuna-xi.vercel.app
Work happens on the `main` branch. Every push to main deploys to production.

## Architecture notes
- Two roles: `renter` and `poster`. Role is permanent once set.
- Two signup doors: /register (renter) and /register/pro (agent, collects NY DOS license)
- Posters cannot publish until `verified = true` (enforced by a DB trigger, not just UI)
- Admin approves posters at /admin (requires `is_admin` on profiles)
- There is NO match loop. Swipe right = private save. Contact happens via
  "Request a tour" which emails the agent through /api/send-inquiry
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

## Temporary instrumentation (remove when Joseph says)
There is `[cuna-debug]` console logging in RequestTour.jsx and send-inquiry.js,
plus a `clientBuild: 'esc-v2'` marker in the inquiry payload. These exist to tell
a real client-side leak apart from a stale bundle or stale deploy: if the server
log shows clientBuild MISSING, an old tab sent that request. Leave them in place
until Joseph asks for them to be stripped.
