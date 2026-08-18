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

## Hard rules
- Never use a VITE_ prefix for secrets. Vite bakes those into the browser bundle.
  Server-side keys go in Vercel env vars and are read only inside /api/ functions.
- FARE Act: listings must disclose all fees. No tenant-paid broker fee option
  exists or should be added.
- Fair housing: listing descriptions must not state preferences about tenants.
- You have no database access. The anon key in .env.local cannot run migrations or
  admin queries. When a change needs SQL, write the SQL and hand it to Joseph to run
  in the Supabase SQL editor — don't attempt it via curl or the REST API.

## Debugging lesson
Failures in this project are usually SILENT: a missing RLS policy returning zero
rows, a field quietly dropped from an insert, a stale deploy. When something shows
no results, check the database directly before assuming the UI is wrong. Confirm
Vercel says "Ready" before testing.
