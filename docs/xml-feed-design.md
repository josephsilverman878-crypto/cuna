# Listing feed import (XML) — design and stub

Status: **design only**. `api/feed-import.js` is a stub that answers 501 unless
`FEED_IMPORT_ENABLED=true` is set in Vercel, and even then only validates.
Nothing imports. See "Needs Joseph" in `audit-build-progress.md` (NJ-5).

## What a feed import is for

A brokerage with a listing system (RLS/REBNY syndication, a CRM, a property
management tool) publishes an XML file of its active listings at a URL. Cuna
would fetch that file on a schedule, create listings for new rows, update
changed ones, and mark missing ones off-market, so the agent never posts by
hand. CSV bulk upload (`/bulk`) covers the one-off case today.

## Format

Cuna's own simple schema, because no NYC feed format is both open and
universal. Each brokerage maps its export to this (most systems can emit a
custom XML template). One `<listing>` per unit:

```xml
<cuna-feed version="1" brokerage="Example Realty" generated="2026-11-05T15:00:00-05:00">
  <listing external_id="EX-1234" updated="2026-11-04T10:00:00-05:00">
    <agent_email>agent@example.com</agent_email>   <!-- must be a verified Cuna poster on the brokerage's team -->
    <listing_type>rent</listing_type>               <!-- rent | sale -->
    <property_type>condo</property_type>            <!-- sale only -->
    <address>342 9th Street #3</address>
    <city>Brooklyn</city>
    <zip_code>11215</zip_code>
    <price>3400</price>
    <bedrooms>1</bedrooms>
    <bathrooms>1</bathrooms>
    <sqft>650</sqft>
    <description>Sunny one-bedroom ...</description>
    <pets_policy>cats_only</pets_policy>            <!-- allowed | cats_only | none -->
    <available_date>2026-12-01</available_date>
    <fees>                                          <!-- FARE Act: every tenant cost, 0 when none -->
      <security_deposit>3400</security_deposit>
      <application_fee>20</application_fee>
      <move_in_fee>0</move_in_fee>
      <other description="Amenity fee">150</other>
    </fees>
    <lease_term_months>12</lease_term_months>
    <months_free>1</months_free>
    <amenities><a>Laundry</a><a>Dishwasher</a></amenities>
    <photos><photo>https://.../1.jpg</photo><photo>https://.../2.jpg</photo><photo>https://.../3.jpg</photo></photos>
    <status>active</status>                         <!-- active | in_contract | rented | sold | off_market -->
  </listing>
</cuna-feed>
```

## Pipeline (when built)

1. **Registration.** A brokerage owner (see `/team`) registers a feed URL and
   gets a feed token; stored in a new `listing_feeds` table (brokerage_id,
   url, token, last_run_at, last_result jsonb). Owner-only RLS.
2. **Fetch.** A Vercel cron (`api/feed-import.js`, guarded by `CRON_SECRET`
   like `alerts-digest.js`) downloads each feed, with a size cap (10 MB) and a
   per-feed timeout.
3. **Validate every row** with the same rules as the forms and the CSV path:
   `src/lib/listingQuality.js` (price band, FARE fees, 3+ photos) and
   `src/lib/fairHousing.js` (blocked language). A row that fails is skipped
   and reported; it never silently publishes.
4. **Geocode** each address with NYC GeoSearch (`src/lib/geocode.js` logic
   moved server-side) so the listing lands on the map and gets a BBL. The
   database trigger assigns the neighborhood.
5. **Upsert** by `(brokerage_id, external_id)` with a new
   `listings.feed_external_id` column and unique index. Status changes
   follow the feed; a listing absent from two consecutive runs goes
   `off_market`. The duplicate-address index still applies: a second live
   listing at the same address + unit from any source is refused and
   reported back to the brokerage.
6. **Report** per run: created / updated / skipped (with reasons) to the
   owner's team page and, if `FEED_EMAILS_ENABLED=true`, by email through
   Resend (default off; previews send only to `INQUIRY_TEST_RECIPIENT`).

## Writes it needs (not run)

- `listings.feed_external_id text`, `listings.feed_id uuid`, unique index
  on `(feed_id, feed_external_id)`.
- `public.listing_feeds` table with owner-only RLS, service-role writes.
- A service-role path for inserts on behalf of a poster: the import runs as
  the server, so the `listings_require_verified` trigger and the
  verified-agent check must be re-asserted in the import code.

## Open questions for Joseph (NJ-5)

- Which format do the first brokerages actually have? If they are on a
  RESO Web API or a RETS server, Cuna should pull from that instead of
  asking for a file.
- Photo hosting: link to their URLs (fast, but a broken link breaks the
  listing) or copy into Supabase Storage (reliable, costs storage).
- Who is allowed to register a feed: brokerage owners only, or any verified
  poster for their own listings.
