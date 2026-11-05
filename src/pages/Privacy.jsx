import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

const H = ({ children }) => (
  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '19px', margin: '28px 0 10px' }}>{children}</h2>
)
const P = ({ children }) => (
  <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--charcoal-soft)', marginBottom: '14px' }}>{children}</p>
)
const UL = ({ children }) => (
  <ul style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--charcoal-soft)', paddingLeft: '20px', marginBottom: '14px' }}>{children}</ul>
)

// Every statement here describes what the app actually does once
// feature/listing-status and feature/saved-alerts are live (33 and 34 SQL).
// Before changing a feature that touches personal data, update this page in
// the same change.

export default function Privacy() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)',
        padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--warm-gray)', display: 'flex',
        }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600 }}>
          Privacy Policy
        </h1>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px' }}>
        <div className="card">
          <p style={{ fontSize: '13px', color: 'var(--warm-gray)', marginBottom: '20px' }}>
            Last updated: November 5, 2026
          </p>

          <P>
            This Privacy Policy explains what information Cuna collects when you use the Cuna
            website and services (the "Service"), why we collect it, who sees it, how long we keep
            it, and the choices you have. We have tried to write it the way we would explain it to
            you in person. If anything is unclear, ask us.
          </P>
          <P>
            Your use of the Service is also governed by our{' '}
            <Link to="/terms" style={{ color: 'var(--terracotta)', fontWeight: 600 }}>Terms of Service</Link>.
          </P>

          <H>Who we are</H>
          <P>
            The Service is operated by <strong>Cuna LLC</strong> ("Cuna," "we," "us," or "our").
            Cuna LLC is the company responsible for your information under this policy.
          </P>
          <P>
            Cuna LLC<br />
            433 Broadway<br />
            New York, NY 10013<br />
            <strong>hello@hellocuna.com</strong>
          </P>

          <H>1. What we mean by "personal information"</H>
          <P>
            Personal information is anything that identifies you or could reasonably be linked to
            you: your name, email address and phone number, the details on your account, what you
            do on the Service, and whatever you choose to share in a tour request or a question.
            Counts that are not tied to anyone, such as the number of times a listing has been
            viewed, are not personal information.
          </P>

          <H>2. What we collect, and why</H>
          <P><strong>Information you give us</strong></P>
          <UL>
            <li><strong>Account details</strong> — your email address, a password, your name, your cell phone number, whether you signed up as a Renter or a Poster, and the time you accepted our Terms and this policy. Your password is stored only in scrambled (hashed) form by our sign-in provider; we never see it. We use these to run your account, sign you in, and reach you about things you have asked us to do.</li>
            <li><strong>Poster licence details</strong> — if you sign up as a Poster: your name as it appears on your New York Department of State real estate licence, your licence number, your licence type (salesperson, broker, or owner without a licence), and your brokerage name if you give one. We use these to check that you may publish listings. Section 6 says who sees them.</li>
            <li><strong>Poster page details</strong> — if you are a Poster, an optional short bio for your public agent page, and, if you listed yourself as an owner, the address of the property you own, which we turn into its tax lot number so an administrator can compare it with public ownership records. Section 8D covers agent pages.</li>
            <li><strong>Renter preferences</strong> — if you are a Renter, you can optionally tell us your budget range, bedrooms, minimum square footage, preferred neighborhoods, target move-in date, whether you have pets and what kind, and your credit score range. We use budget, bedrooms, square footage and neighborhoods to filter your feed when you turn filters on. Move-in date, pets and credit range are used for one thing only: they can be included in a tour request if the matching sharing switch is on (Section 5).</li>
            <li><strong>Sharing switches</strong> — four settings on your Renter profile that control what a tour request includes: phone number, move-in date, pets, and credit score range. Two start on (move-in date and pets) and two start off (phone number and credit score range). You can change any of them at any time.</li>
            <li><strong>Saved and hidden listings</strong> — the listings you save with the heart and the ones you hide from your feed. Saving is a private bookmark: the Poster is not told who saved a listing, only how many people did. We do use your saves to tell you when those listings change (see "Alerts about listings you save" below).</li>
            <li><strong>Search settings and saved searches</strong> — the filters you set in the feed (rent or buy, price, bedrooms, bathrooms, size, pets, amenities, neighborhoods, an area you draw on the map and your sort), which we keep on your account so your feed is the same on every device, and any search you save with a name. Section 8A explains saved searches and the counts we show Posters.</li>
            <li><strong>Rental application</strong> — if you are a Renter and choose to fill one in: employer, job title, annual income as an amount, target move-in date, current address, up to three references, notes, and up to five documents you upload. Section 8B explains who can see it and how to delete it.</li>
            <li><strong>Tour requests</strong> — when you ask to tour a listing: whether you want an in-person or video tour, up to three preferred times, any message you write, and a record of exactly which optional details were included. Section 5 covers this in full.</li>
            <li><strong>Questions to Posters</strong> — if you use "Ask a question" on a listing, the question you write. Only your name and email travel with it. Section 5.</li>
            <li><strong>Listing reports</strong> — if you report a listing: the reason you pick, any note you write, and which account reported it. Section 8C.</li>
            <li><strong>Team accounts</strong> — if you are a Poster who creates a brokerage team or is added to one: the team's name and who belongs to it. Section 8D.</li>
            <li><strong>"New to NY" quiz answers</strong> — if you take the optional neighborhood quiz, your answers about what you want from a place to live. Section 9 covers where they are kept.</li>
            <li><strong>Listings</strong> — if you are a Poster: the address, neighborhood, rent or asking price, fees, lease terms and any free months, for a sale the common charges, maintenance, taxes and financing terms, bedrooms, bathrooms, size, description, amenities, availability date, photos, floor plans and links to a video or 3D tour of each listing you post; its status (Active, In contract, Rented, Sold, Off-market or De-listed) and a history of its status and price changes; and any open house times you schedule. When you type an address we look it up with the New York City GeoSearch service and store the map coordinates, the neighborhood the point falls in, and the building's tax lot and building numbers, so the listing can be placed on a map and matched with public building records. Listings, their status, their open houses and their photos are public. Do not put anything in a listing that you would not want anyone on the internet to see. Section 7 explains statuses, history and open houses.</li>
            <li><strong>Lead status</strong> — if you are a Poster, the status you set on each tour request or question in your inbox (new, replied, toured, closed). It is yours to see; the Renter is not told.</li>
            <li><strong>Notifications</strong> — the alerts we create for you about listings you saved: which listing, what changed, when, whether you have read it, and whether it has been emailed to you. See "Alerts about listings you save" below.</li>
            <li><strong>Emails you send us</strong> — anything you send to hello@hellocuna.com, including from the "Tell us what you're looking for" button on the quiz results page. That button opens your own email app with a draft addressed to us that includes the neighborhood and your budget, size, commute and pace answers. Nothing leaves your device until you press send in your email app, and you can edit the draft first.</li>
          </UL>
          <P><strong>Information collected automatically</strong></P>
          <UL>
            <li><strong>Listing view counts</strong> — when a listing page is opened, we count one view per visitor per day so the Poster can see how much interest it is getting. To avoid counting the same visitor twice we keep a random string in your browser's storage and store it with the listing and the New York date; it is not tied to your account and we never record who viewed what. Posters see totals and a count per day, never visitors.</li>
            <li><strong>Map and address lookups</strong> — when a page shows a map, your browser loads it from Mapbox, which receives your IP address and the map area. When you type an address, or use the commute calculator or walking times, your browser sends that address or those coordinates to the New York City GeoSearch service or to Mapbox to get the answer. The destination you type into the commute calculator is kept only in your own browser.</li>
            <li><strong>Technical logs</strong> — the companies that host the Service keep ordinary server logs: the pages and functions requested, the time, the result, your IP address and your browser type. We use them only to keep the Service running and to investigate problems. The "Automatic information and browser storage" section says who keeps them and for how long.</li>
            <li><strong>Browser storage</strong> — a small amount of information kept in your own browser so the Service works: your signed-in session, and your quiz answers while you are taking the quiz. The "Automatic information and browser storage" section explains it.</li>
          </UL>
          <P>
            We do not collect precise location (we never read your device's location; map lookups
            use only what you type), payment or bank details (Cuna never handles money and charges no
            application fee), Social Security or other government identifiers, source-of-income
            information, or advertising identifiers, and we do not build profiles of you from other
            sources.
          </P>

          <H>3. How we use your information</H>
          <UL>
            <li>To create your account, sign you in, and keep it secure;</li>
            <li>To show listings, filter your feed by the preferences you set, and keep your saved and hidden lists;</li>
            <li>To send a tour request or a question to the Poster of a listing when you ask us to, and a confirmation copy to you;</li>
            <li>To limit how many tour requests and questions one account can send in a short period, so Posters are not flooded;</li>
            <li>To show Posters the tour requests, questions, save counts and view counts for their own listings;</li>
            <li>To tell you, under the bell in the app, whenever a listing you saved changes — status, price, fees, available date, open houses, description, photos or other details — and, if your email switch is on, to send you a summary by email (see "Alerts about listings you save" below);</li>
            <li>To check that Posters hold a valid licence before they can publish, by comparing the licence details you gave with the New York Department of State's public list of active licensees, and, for owners, by comparing the property address you gave with the city's public ownership record (PLUTO). An administrator looks at the comparison and decides; nothing is approved automatically;</li>
            <li>To email you when a saved search has new matches, and to show verified Posters how many saved searches name a neighborhood, bedroom count or price band (counts only, and only when at least three searches fall in a bucket);</li>
            <li>To refuse a second live listing at the same address and unit, and to flag for human review a listing priced far below comparable ones nearby or using photos from another Poster's listing;</li>
            <li>To show verified Posters' public agent pages, and to build the building, neighborhood and market pages from public records and the listings on Cuna;</li>
            <li>To rank neighborhoods for you in the quiz, if you take it, and to save your results to your account if you ask;</li>
            <li>To answer your emails and act on your requests, including privacy requests;</li>
            <li>To keep the Service safe: investigating suspected fraud, fake listings, fair-housing violations, or breaches of our Terms;</li>
            <li>To meet legal obligations.</li>
          </UL>
          <P>
            We do not use your information for advertising, we do not sell or rent it, and we do not
            share it with data brokers.
          </P>

          <H>4. When we share your information</H>
          <UL>
            <li><strong>With the Poster of a listing, when you send a tour request or ask a question.</strong> For a tour request the Poster receives your name, the email address on your account, your tour type, times and message, and only those optional details whose sharing switch was on when you sent it. For a question the Poster receives your name, your email address and the question, and nothing else. Section 5 lists exactly what is and is not included.</li>
            <li><strong>With Renters, if you are a Poster.</strong> Your listings, their status, their open houses and their photos are public. A Renter who sends you a tour request or a question learns your name and your email address, because our email to them names you and is addressed so that a reply goes to you. Your licence details and brokerage are never included. Section 6 says what the listing page itself loads.</li>
            <li><strong>With Renters who saved your listing, if you are a Poster.</strong> They are told what changed — a new status, a price change, a fee or available-date change, an open house added, changed or cancelled, or that you updated the details (description, photos, amenities and so on) — in a plain sentence naming the listing. Nothing about you travels with it, and you are never told who was notified.</li>
            <li><strong>With the public.</strong> Listings, their status, open houses and photos can be seen by anyone, with or without an account, including on the quiz results page, on building and neighborhood pages, and in search engines. A verified Poster's agent page is public too: name, photo if any, bio, brokerage, licence type and licence number, and current and past listings on Cuna (Section 8D).</li>
            <li><strong>With your team owner, if you are a Poster on a brokerage team.</strong> The owner of your team can see and update your listings and sees your name and email on the team page. Your leads still go to you. Section 8D.</li>
            <li><strong>With the companies that run the Service for us.</strong> Each sees only what it needs to do its job:
              <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                <li><strong>Supabase</strong> — our database, sign-in system and photo storage. It holds all account, listing and activity data and sends password-reset emails.</li>
                <li><strong>Vercel</strong> — hosts the website, runs the small function that sends tour-request and question emails, and runs a scheduled job (once a day now, at most twice a day) that prepares and sends saved-listing summary emails. It keeps short-lived request logs.</li>
                <li><strong>Resend</strong> — delivers tour-request, question, saved-listing and saved-search emails from hello@hellocuna.com. It handles the contents of each email in order to deliver it.</li>
                <li><strong>Mapbox</strong> — draws the maps and answers walking-time and commute requests. It receives your IP address, the map area you look at, and the addresses or coordinates your browser sends for those requests.</li>
                <li><strong>NYC GeoSearch (NYC Planning Labs), NYC Open Data, New York State Open Data and the New York State Department of Health</strong> — public services your browser queries directly: an address to place it on the map, a licence number or a tax lot number for the verification checks an administrator runs, and the public school, hospital, subway, building and sales records behind the building, neighborhood and market pages. They receive the query and your IP address and nothing from your account.</li>
                <li><strong>Google and Apple</strong> — only if sign-in with Google or Apple is switched on and you choose it: they confirm who you are and give us your name and email address. We do not receive your Google or Apple password. These options are off until this policy says otherwise.</li>
                <li><strong>Google Fonts</strong> — the typefaces on the site load from Google's servers, so Google receives your IP address and browser details when a page loads.</li>
                <li><strong>Unsplash</strong> — when a listing has no photo, a placeholder image is loaded from Unsplash, which receives the same technical details.</li>
              </ul>
            </li>
            <li><strong>With our own team.</strong> Cuna administrators can see Poster licence details in order to verify them, and the people who operate the Service have access to the database to run and fix it. Access is limited to what the job needs.</li>
            <li><strong>When the law requires it.</strong> We may disclose information to comply with a law, subpoena or court order, or where we believe in good faith that it is necessary to protect the rights, safety or property of Cuna, our users or the public.</li>
            <li><strong>If Cuna changes hands.</strong> If Cuna LLC is merged, acquired, or sells all or part of its business, your information may be transferred to the new owner as part of that deal. This policy would keep applying to it, and we would tell you before your information became subject to a different one.</li>
          </UL>

          <H>5. Tour requests, questions, and the emails we send</H>
          <P>
            There is no messaging or matching on Cuna. The only ways your details reach a Poster
            are when you press "Request a tour" on a listing and submit the form, or when you press
            "Ask a question" and send one. Both work for a listing in any status, as long as the
            Poster can be reached.
          </P>
          <P>
            <strong>Tour requests.</strong> Before you send, the form shows you exactly what will be
            shared. When you send, two emails go out from <strong>hello@hellocuna.com</strong>: one
            to the Poster of that listing, and a confirmation copy to you at the email address on
            your account. The email to the Poster contains:
          </P>
          <UL>
            <li>Your name and the email address on your account;</li>
            <li>The listing: its address, rent and a link to it on Cuna;</li>
            <li>Whether you asked for an in-person or video tour, the times you offered, and any message you wrote;</li>
            <li><strong>Only</strong> those optional details whose switch was on: your phone number, your target move-in date, whether you have pets (and any pet details), and your credit score range.</li>
          </UL>
          <P>
            Nothing else from your profile is sent: not your budget, not your saved listings, not
            your preferred neighborhoods, not your quiz answers. If a switch is off, that line is
            left out of the email entirely rather than sent as "not provided." Remember that two
            switches start on (move-in date and pets); turn them off on your profile if you would
            rather not share them.
          </P>
          <P>
            <strong>Your rental application</strong> is never sent by email. If you have filled one in
            and tick "share my rental application" on a tour request, a copy of it as it stands at that
            moment, and the list of documents you attached, is stored with that one request, and only
            the Poster of that listing can read it and open those documents, in their Cuna inbox. The
            email to the Poster says only that you shared an application. Leaving the box unticked
            shares nothing. Section 8B has the details.
          </P>
          <P>
            <strong>Questions</strong> work the same way with less in them: two emails from
            hello@hellocuna.com, one to the Poster and a copy to you. A question carries only your
            name, the email address on your account, the listing, and the question you wrote. None
            of the sharing switches apply to questions, and nothing from your profile is attached.
          </P>
          <P>
            Each email is addressed so that a reply goes straight to the other person: the Poster's
            email carries your address as its reply-to, and your copy carries the Poster's address.
            If either of you replies, that reply travels by ordinary email between the two of you
            and does not pass through Cuna.
          </P>
          <P>
            <strong>Limits.</strong> To keep the Service usable for Posters, one account can send at
            most 10 tour requests and questions combined in an hour, and at most 3 for the same
            listing in a day. If you reach a limit you are told, nothing is stored, and nothing is
            sent.
          </P>
          <P>
            We keep a record of each tour request and each question. For tour requests the record
            includes a snapshot of exactly which optional details were included at the moment you
            sent it. The snapshot does not change afterwards: if you later switch a detail off,
            requests you already sent still show what you shared at the time, because the Poster
            already received it. Switching a detail off stops it being included in future requests.
            The Poster sees the same record on their dashboard, next to your name, email and the
            times you offered or the question you asked. The record is saved before the email is
            sent, so if an email ever fails to go out the Poster can still see your request there.
          </P>
          <P>
            Email is not an encrypted medium, and once an email reaches the Poster's inbox it is
            outside our control. We cannot recall it or delete it for them. Resend, which delivers
            these emails for us, keeps delivery records for a limited time under its own terms.
          </P>

          <H>6. Poster licence information and your contact details</H>
          <P>
            If you sign up as a Poster, we ask for the name on your New York Department of State
            real estate licence, your licence number and type, and your brokerage name. A Cuna
            administrator reviews these details and may check them against the public Department
            of State licence records. Until you are verified you can prepare listings but not
            publish them.
          </P>
          <P>
            Once you are verified, your public agent page (Section 8D) shows your name, brokerage,
            licence type and licence number, which are matters of public record at the Department
            of State, along with the bio you choose to write. The name on your licence, your phone
            number and your email address are not shown there. A Renter who sends you a tour
            request or a question learns your name and email address and nothing more. You can view
            and update your licence details and your bio on your profile at any time.
          </P>
          <P>
            <strong>Checking your details.</strong> An administrator can run two comparisons from
            the admin page, using public data read live into their browser: your licence number
            against the New York Department of State's active-licensee dataset (name, licence type,
            brokerage and expiry), and, if you signed up as an owner and gave a property address,
            that property's recorded owner in the city's PLUTO dataset against your account name and
            brokerage. The result is shown to the administrator as match or mismatch; we store no
            copy of the public record, and a person makes the decision.
          </P>
          <P>
            So that the "Request a tour" and "Ask a question" buttons can work, the listing page
            loads your name, email address and phone number into the visitor's browser without
            displaying them. A technically minded visitor could read them there. If you would rather
            not have a phone number on your account at all, you can remove it on your profile.
          </P>

          <H>7. Listing statuses, history and open houses</H>
          <P>
            Every listing has one of five statuses: <strong>Active</strong>, <strong>In contract</strong>,{' '}
            <strong>Rented</strong>, <strong>Off-market</strong> or <strong>De-listed</strong>. The
            Poster can move a listing between them at any time, including back to Active. Posters
            cannot delete a listing: De-listed is the final state, and a listing remains viewable at
            its own link in every status, marked with its status and the date it changed. Only
            Active and In-contract listings appear in the feed, in search and on quiz results.
          </P>
          <P>
            <strong>History.</strong> We record each change of status and each change of price, with
            the time it happened. That history is written by our database, not by any user, and no
            user can read the raw record. The listing page shows two things computed from it: how
            many days the listing has been on the market, and its most recent price change (the
            amount, the percentage and the date). History describes the listing, not any person.
          </P>
          <P>
            <strong>Open houses.</strong> A Poster can add, change or cancel open house times for a
            listing. Times are entered and shown as New York time. A cancelled open house is kept
            on record, marked cancelled, rather than deleted. Open houses are shown to anyone who
            can see the listing, on the listing page and as a tag on feed cards, and are not tied to
            any person other than the Poster. Renters who saved the listing are told when an open
            house is added, changed or cancelled (see "Alerts about listings you save" below).
          </P>

          <H>8. Alerts about listings you save</H>
          <P>
            When you save a listing, we use that save to tell you when something about it changes.
            Any change the Poster makes to the listing counts: its status (In contract, Rented,
            Off-market, De-listed, or Active again), its price, its fees, its available date, an
            open house added, changed or cancelled, and edits to the details — the description,
            photos, amenities, pet policy, size or address. We do not alert you about things you
            cannot see, such as a listing's view count or our own bookkeeping, and a save that
            changes nothing creates nothing.
          </P>
          <P>
            <strong>The bell.</strong> Each change becomes a short sentence naming the listing —
            "123 Main St was marked Rented", "Price dropped $200 on 123 Main St (now $2,800)" — and
            appears right away under the bell in the app, with an unread count. Small edits to the
            details are grouped: however many times a Poster edits the description or photos in a
            day, you get one line, "The poster updated the listing details (description, photos)".
            Tapping a notification opens the listing; "Mark all read" clears the count.
          </P>
          <P>
            <strong>Summary emails.</strong> Saving a listing also signs you up for its email
            updates: we email you a summary from hello@hellocuna.com, grouped by listing, with a
            link to each listing on hellocuna.com. We send one only when
            something has changed since your last summary, and at most twice a day (currently once
            a day, in the morning New York time). Each summary covers everything since the previous
            one, so the same change is never emailed twice. These are not marketing emails: they
            contain only the changes to listings you chose to save. Resend delivers them for us.
          </P>
          <P>
            <strong>What we store.</strong> Each notification is stored on your account: the
            listing, the sentence, which details it covers, when it was created, whether you have
            read it, and whether it has been emailed to you. We keep these records for as long as
            your account exists; deleting your account removes them. Only you can read your
            notifications. Posters are never told who received one; they see only how many people
            saved a listing, never the names.
          </P>
          <P>
            <strong>Stopping the emails.</strong> The updates follow your saves: to stop hearing
            about a listing, unsave it (the heart on the listing, or "Remove" in your Saved
            listings), and both the emails and the bell notifications about it stop. The link at
            the bottom of every summary email takes you to your Saved listings — if you are signed
            out, to the sign-in page first and then straight to Saved listings. There is no separate
            email switch for these updates. Tour-request, question and password-reset emails are
            not affected either way, because they are the direct result of something you asked us
            to do.
          </P>

          <H>8A. Saved searches and what Posters see of them</H>
          <P>
            You can save a search (your filters, neighborhoods, drawn area and whether you are
            renting or buying) with a name. When a listing is published or updated that matches a
            saved search, we create a notification under the bell and, if saved-search emails are
            switched on for the Service, include it in your summary email. Saved searches are yours
            alone: no Poster can see them. Verified Posters can see <strong>counts</strong> of saved
            searches by neighborhood, by bedroom count and by price band, and only for a bucket that
            holds at least three searches, so no count can point to a person. Delete a saved search
            from your profile at any time.
          </P>

          <H>8B. Rental applications</H>
          <P>
            If you are a Renter you can fill in one reusable rental application on your profile:
            employer, job title, annual income as an amount, target move-in date, current address, up
            to three references, notes, and up to five documents (PDF, JPEG or PNG, such as pay
            stubs, an employment letter or ID). It is optional, it is free, and Cuna never charges an
            application fee.
          </P>
          <P>
            <strong>Only you can read it.</strong> Posters, administrators and other users cannot
            open your application or your documents. Documents are stored in a private folder that
            only your account can read. A Poster can read a copy only when you tick "share my
            rental application" on a tour request, and then only the Poster of that listing, only
            the copy taken at that moment, and only the documents attached at that moment. That copy
            stays with that request, as Section 5 describes for the other shared details, so the
            Poster still sees what you chose to share even if you later change or delete your
            application.
          </P>
          <P>
            <strong>What we never ask for.</strong> Not your Social Security number, not bank or
            card numbers, and not where your income comes from. Our form refuses text shaped like
            those numbers, and we ask you to black out account numbers on anything you upload.
            Cuna is not a tenant-screening company and does not pull credit or background reports.
          </P>
          <P>
            <strong>Deleting it.</strong> The "Delete my application and documents" button on the
            application page removes the application and the files straight away; you can also
            delete single documents. Copies already shared with a Poster remain with those requests.
          </P>

          <H>8C. Reports, duplicates and flags</H>
          <P>
            Anyone signed in can report a listing from its page, choosing a reason and adding a
            note. We store the report with your account so we can follow up and so one account cannot
            flood reports (at most five a day, and one per listing per week). Administrators see the
            report, the reason, the note and the email address of the account that sent it; the Poster
            is not told who reported them. Separately, our database refuses a second live listing at
            the same address and unit, and flags for human review a listing priced far below
            comparable live listings in its neighborhood or using photos already on another Poster's
            listing. Flags are seen by administrators only and are about the listing, not a person.
          </P>

          <H>8D. Agent pages, team accounts and demand counts</H>
          <P>
            Every verified Poster has a public page at an address like hellocuna.com/agent/… that
            shows their name, photo if they added one, bio, brokerage, licence type and number, and
            their current and past listings on Cuna. Listing pages link to it. A bio must describe the
            service, never the tenants an agent is looking for; we scan it for fair-housing language
            before saving it.
          </P>
          <P>
            A verified Poster can create a brokerage team and add other verified Posters by the email
            they signed up with. Team members see each other's names on the team page; the owner also
            sees members' email addresses and can see and update every team listing. Leads still go
            to the Poster who posted the listing. Leaving a team, or removing a member, is done by
            the owner on the team page.
          </P>
          <P>
            Verified Posters can see how many saved searches name a neighborhood, bedroom count or
            price band. These are counts only, shown only for buckets of three or more searches, and
            carry nothing about who is searching.
          </P>

          <H>8E. Signing in with Google or Apple</H>
          <P>
            If these options are switched on, you can sign in through Google or Apple instead of a
            password. They confirm your identity and give us your name and email address; we never
            receive your Google or Apple password. A new account created this way still chooses a
            role and accepts these Terms and this policy before anything is stored. Until the sign-in
            page shows these buttons, they are off.
          </P>

          <H>9. The "New to NY" quiz</H>
          <P>
            The neighborhood quiz is optional. You can take it without an account, and nothing else
            on Cuna depends on it. It asks only about <strong>what you want from a place to
            live</strong>: whether you are renting or buying, your budget range, how much space you
            need, where you commute and how long you will travel, how busy you want the streets to
            feel, which things matter to you (parks, transit, restaurants, nightlife,
            walkability), whether you have a car, the home styles you like, and when you hope to
            move. It deliberately does not ask who you are.
          </P>
          <P>Where your answers live depends on what you do with them:</P>
          <UL>
            <li><strong>While you take the quiz</strong> — your answers are kept in your own browser's storage so you can close the tab and pick up where you left off. They are not sent to us at this stage.</li>
            <li><strong>If you are signed in as a Renter and press "Save my results"</strong> — your answers are stored on your Cuna account with the date you saved them, so you can return to them on another device. Only you can read them. Posters cannot see them, and we do not use them for anything except showing you your results.</li>
            <li><strong>When you sign out</strong> — the copy in that browser is cleared. A saved set of answers is tied to the account that saved it, so someone else signing in on the same browser is not shown yours.</li>
          </UL>
          <P>
            <strong>Results are suggestions, not decisions.</strong> The quiz ranks neighborhoods
            from your stated preferences and public data. It does not make any decision about you,
            it has no legal or similar effect, and nobody at Cuna reviews or acts on your answers
            unless you email them to us yourself.
          </P>
          <P>
            The school, school-district, hospital and price information on the results cards comes
            from public datasets (the NYC Department of Education's school list as of the 2024–25
            school year, NYC Department of City Planning district boundaries, the New York State
            Department of Health facility list, and recorded sales and asking rents). It describes
            places, not people, and it is not personal information about you.
          </P>

          <H>10. Automatic information and browser storage</H>
          <P>
            <strong>We set no cookies of our own and use no analytics or advertising trackers.</strong>{' '}
            The Service keeps a few things in your browser's local storage because it cannot work
            without them: the token that keeps you signed in, your in-progress quiz answers, for up
            to an hour a note that you asked to save your quiz results before signing in, the random
            string used to count one listing view per visitor per day, the destination you typed into
            the commute calculator, and a cached copy of the neighborhood map shapes. Signing out
            clears the quiz answers. Clearing your browser's site data removes all of them.
          </P>
          <P>
            The companies that host the Service keep ordinary technical logs. Vercel logs requests
            to the website, to our email function and to the scheduled job (the address requested,
            the time, the result, your IP address and browser type). Supabase logs requests to the
            database, sign-in and photo storage. These logs are kept for short periods set by each
            provider, measured in hours or days, and we do not combine them with your account to
            track you.
          </P>
          <P>
            Listing pages count views, one per visitor per New York day, using the random string
            described in Section 2. The Poster sees totals and a count per day; we do not keep a list
            of who viewed what, and the view records hold no account identifier.
          </P>

          <H>11. Your email choices</H>
          <P>
            <strong>Service emails</strong> are the direct result of something you did: the tour
            request or question you asked us to send, your confirmation copy, and password-reset
            emails from our sign-in provider when you request one. You cannot opt out of these while
            using those features, because they are the feature.
          </P>
          <P>
            <strong>Saved-listing summary emails</strong> come with saving a listing. They go out
            only when a listing you saved has changed, at most twice a day, and they stop when you
            unsave the listing (see "Alerts about listings you save" above). They are notices about
            something you asked us to watch, not promotions.
          </P>
          <P>
            <strong>Promotional emails.</strong> We do not send any. If we ever start, we will ask
            first, every such email will carry an unsubscribe link, and saying no will not affect
            your account.
          </P>

          <H>12. How long we keep information</H>
          <UL>
            <li><strong>Your account, preferences, search settings, saved searches, saved and hidden listings, quiz answers, notifications, reports you sent, team membership, and (for Posters) your bio and owner address</strong> — for as long as your account exists. Deleting your account removes them.</li>
            <li><strong>Your rental application and its documents</strong> — until you delete them on the application page, or until your account is deleted. Copies shared on a tour request stay with that request as described below.</li>
            <li><strong>Listing view records</strong> — one row per listing, per anonymous browser string, per day, with no account identifier; kept with the listing.</li>
            <li><strong>Tour requests and questions</strong>, including the shared details and any shared application copy — for as long as your account exists, because the Poster needs the record of who asked about their listing. When your account is deleted the records go with it. The copy already in the Poster's email inbox is theirs and outside our control.</li>
            <li><strong>Listings, their status and price history, and their open houses (including cancelled ones)</strong> — for the life of the listing. Posters cannot delete a listing; a De-listed listing stays stored and viewable at its own link. If we remove a listing at a Poster's request, its history, open houses, tour requests, questions, saves and the notifications about it go with it.</li>
            <li><strong>Photos</strong> — when a listing is removed, its photo files may remain in our storage until we clear them. Email us and we will remove them straight away.</li>
            <li><strong>Technical logs</strong> — hours to days, at our providers.</li>
            <li><strong>Backups</strong> — our database provider keeps no automatic backups on our current plan. If we take a copy of the database for safekeeping, information deleted afterwards can remain in that copy until the copy is replaced or discarded.</li>
          </UL>
          <P>
            We may keep limited information longer where the law requires it, to resolve a dispute,
            or to enforce our Terms, and we will tell you if that applies to your request.
          </P>

          <H>13. Your rights, and how to use them</H>
          <P>These apply to everyone who uses Cuna, wherever you live:</P>
          <UL>
            <li><strong>See your information.</strong> Ask us and we will send you a copy of the personal information we hold about you, in a common file format.</li>
            <li><strong>Correct it.</strong> You can edit your name, phone, preferences, sharing switches, saved searches, your rental application and (for Posters) licence details, bio and owner address on your profile. Email us for anything you cannot change yourself.</li>
            <li><strong>Delete parts yourself.</strong> Saved searches, saved listings, your rental application and its documents can be deleted by you on the spot, without asking us.</li>
            <li><strong>Delete it.</strong> Email us from the address on your account and ask. We will delete your account and the personal information tied to it, as described in Section 12, except where we must keep something for a legal reason, and we will tell you if so.</li>
          </UL>
          <P>
            To make any request, email <strong>hello@hellocuna.com</strong> or write to Cuna LLC,
            433 Broadway, New York, NY 10013. We will confirm it is you by replying to the email
            address on your account, and we will respond within a reasonable time and tell you if
            we need longer. We will never treat you differently for making a request. Depending on
            where you live, your state's law may give you further rights, including the right to
            appeal a decision we make; use the same address for those.
          </P>

          <H>14. We do not sell your information</H>
          <P>
            We have never sold or rented personal information and we do not share it for
            advertising. There are no advertising trackers on the Service, so there is nothing to
            opt out of; if that ever changes, this policy will say so before it does.
          </P>

          <H>15. Children</H>
          <P>
            The Service is for people 18 and older. We do not knowingly collect personal information
            from anyone under 18, and in no event from children under 13. If we learn that we have,
            we will delete it. If you believe a minor has given us information, email us.
          </P>

          <H>16. Links to other sites</H>
          <P>
            The quiz results link to the New York City Department of Education's school search, and
            the "Tell us what you're looking for" button opens your own email app. Replies to
            tour-request and question emails happen in your and the Poster's own email services.
            Those sites and services have their own privacy practices, which we do not control.
          </P>

          <H>17. Security</H>
          <P>
            Passwords are stored hashed, connections use HTTPS, and database rules restrict each
            user to the rows they are allowed to see. Application documents live in a private
            storage area that is not listable or readable by anyone but you, and by the Poster of a
            listing for the files you chose to share on a request to them, through short-lived links. Access by our team is limited to what
            operating the Service needs. No system is perfectly secure, so please use a strong,
            unique password and email us immediately if you suspect someone else has used your
            account.
          </P>

          <H>18. Users outside the United States</H>
          <P>
            The Service is operated from the United States, is intended for people looking for
            homes in New York, and stores information in the United States. If you use it from
            elsewhere, your information will be processed and stored there.
          </P>

          <H>19. Changes to this policy</H>
          <P>
            The date at the top is the date this version took effect. If we make a material change,
            we will tell you before it takes effect, by a notice on the Service or by email to the
            address on your account, and we will update the date. Using the Service after a change
            takes effect means you accept the updated policy.
          </P>

          <H>20. Contact</H>
          <P>
            Questions, requests or concerns about your privacy, including deletion and other
            privacy-rights requests:
          </P>
          <P>
            Cuna LLC<br />
            433 Broadway<br />
            New York, NY 10013<br />
            <strong>hello@hellocuna.com</strong>
          </P>
        </div>
      </div>
    </div>
  )
}
