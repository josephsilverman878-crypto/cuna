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
            Last updated: October 21, 2026
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
            <li><strong>Renter preferences</strong> — if you are a Renter, you can optionally tell us your budget range, bedrooms, minimum square footage, preferred neighborhoods, target move-in date, whether you have pets and what kind, and your credit score range. We use budget, bedrooms, square footage and neighborhoods to filter your feed when you turn filters on. Move-in date, pets and credit range are used for one thing only: they can be included in a tour request if the matching sharing switch is on (Section 5).</li>
            <li><strong>Sharing switches</strong> — four settings on your Renter profile that control what a tour request includes: phone number, move-in date, pets, and credit score range. Two start on (move-in date and pets) and two start off (phone number and credit score range). You can change any of them at any time. A fifth switch, "Email me about saved listings," controls summary emails (see "Saved listings, notifications and alert emails" below).</li>
            <li><strong>Saved and hidden listings</strong> — the listings you save with the heart and the ones you hide from your feed. Saving is a private bookmark: the Poster is not told who saved a listing, only how many people did. We do use your saves to tell you when those listings change (see "Saved listings, notifications and alert emails" below).</li>
            <li><strong>Tour requests</strong> — when you ask to tour a listing: whether you want an in-person or video tour, up to three preferred times, any message you write, and a record of exactly which optional details were included. Section 5 covers this in full.</li>
            <li><strong>Questions to Posters</strong> — if you use "Ask a question" on a listing, the question you write. Only your name and email travel with it. Section 5.</li>
            <li><strong>"New to NY" quiz answers</strong> — if you take the optional neighborhood quiz, your answers about what you want from a place to live. Section 9 covers where they are kept.</li>
            <li><strong>Listings</strong> — if you are a Poster: the address, neighborhood, rent, fees, bedrooms, bathrooms, size, description, amenities, availability date and photos of each listing you post; its status (Active, In contract, Rented, Off-market or De-listed) and a history of its status and price changes; and any open house times you schedule. Listings, their status, their open houses and their photos are public. Do not put anything in a listing that you would not want anyone on the internet to see. Section 7 explains statuses, history and open houses.</li>
            <li><strong>Notifications</strong> — the alerts we create for you about listings you saved: which listing, what changed, when, whether you have read it, and whether it has been emailed to you. See "Saved listings, notifications and alert emails" below.</li>
            <li><strong>Emails you send us</strong> — anything you send to hello@hellocuna.com, including from the "Tell us what you're looking for" button on the quiz results page. That button opens your own email app with a draft addressed to us that includes the neighborhood and your budget, size, commute and pace answers. Nothing leaves your device until you press send in your email app, and you can edit the draft first.</li>
          </UL>
          <P><strong>Information collected automatically</strong></P>
          <UL>
            <li><strong>Listing view counts</strong> — each time a listing page is opened, we add one to that listing's view counter so the Poster can see how much interest it is getting. The counter is a number per listing. We do not record who viewed it.</li>
            <li><strong>Technical logs</strong> — the companies that host the Service keep ordinary server logs: the pages and functions requested, the time, the result, your IP address and your browser type. We use them only to keep the Service running and to investigate problems. The "Automatic information and browser storage" section says who keeps them and for how long.</li>
            <li><strong>Browser storage</strong> — a small amount of information kept in your own browser so the Service works: your signed-in session, and your quiz answers while you are taking the quiz. The "Automatic information and browser storage" section explains it.</li>
          </UL>
          <P>
            We do not collect precise location, payment or bank details (Cuna never handles money),
            government identifiers, or advertising identifiers, and we do not build profiles of you
            from other sources.
          </P>

          <H>3. How we use your information</H>
          <UL>
            <li>To create your account, sign you in, and keep it secure;</li>
            <li>To show listings, filter your feed by the preferences you set, and keep your saved and hidden lists;</li>
            <li>To send a tour request or a question to the Poster of a listing when you ask us to, and a confirmation copy to you;</li>
            <li>To limit how many tour requests and questions one account can send in a short period, so Posters are not flooded;</li>
            <li>To show Posters the tour requests, questions, save counts and view counts for their own listings;</li>
            <li>To tell you, under the bell in the app, when a listing you saved changes status or price or gets an open house added, changed or cancelled — and, if that switch is on, to send you a summary by email (see "Saved listings, notifications and alert emails" below);</li>
            <li>To check that Posters hold a valid licence before they can publish;</li>
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
            <li><strong>With Renters who saved your listing, if you are a Poster.</strong> They are told what changed — the new status, a price change, or an open house added, changed or cancelled — in a plain sentence naming the listing. Nothing about you travels with it, and you are never told who was notified.</li>
            <li><strong>With the public.</strong> Listings, their status, open houses and photos can be seen by anyone, with or without an account, including on the quiz results page.</li>
            <li><strong>With the companies that run the Service for us.</strong> Each sees only what it needs to do its job:
              <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                <li><strong>Supabase</strong> — our database, sign-in system and photo storage. It holds all account, listing and activity data and sends password-reset emails.</li>
                <li><strong>Vercel</strong> — hosts the website, runs the small function that sends tour-request and question emails, and runs a once-a-day scheduled job that prepares saved-listing summary emails. It keeps short-lived request logs.</li>
                <li><strong>Resend</strong> — delivers tour-request, question and saved-listing emails from hello@hellocuna.com. It handles the contents of each email in order to deliver it.</li>
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
            <strong>Licence details are not shown to Renters or the public.</strong> A Renter who
            sends you a tour request or a question learns your name and email address and nothing
            more; your brokerage is not included. You can view and update your licence details on
            your profile at any time.
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
            house is added, changed or cancelled (see "Saved listings, notifications and alert emails" below).
          </P>

          <H>8. Saved listings, notifications and alert emails</H>
          <P>
            When you save a listing, we use that save to tell you when something about it changes:
            when the Poster marks it In contract, Rented, Off-market or De-listed (or Active again),
            when the price goes up or down, and when an open house is added, changed or cancelled.
            Each of these is a short sentence naming the listing — for example "123 Main St was
            marked Rented" — and appears as a notification under the bell in the app, with an
            unread count. Tapping one opens the listing; "Mark all read" clears the count.
          </P>
          <P>
            We store each notification on your account: the listing, the sentence, when it was
            created, whether you have read it, and whether it has been emailed to you. Only you can
            read your notifications. Posters are never told who received one; they already see only
            the number of saves on a listing, never the names.
          </P>
          <P>
            <strong>Alert emails.</strong> Your profile has a switch, "Email me about saved
            listings," which is on by default. When saved-listing emails are switched on for the
            Service, a once-a-day job gathers the notifications that have not yet been emailed to
            you and sends you one summary from hello@hellocuna.com, containing the same sentences
            you see under the bell and links to the listings. We note on each notification when it
            was emailed, so the same change is never sent twice. At launch these emails are switched
            off for everyone; the bell works regardless. When we turn them on, your profile switch
            applies.
          </P>
          <P>
            <strong>Turning alert emails off.</strong> Switch "Email me about saved listings" off on
            your profile, or use the unsubscribe link at the bottom of any alert email. The link
            works without signing in, takes one click, and changes only that switch. The bell keeps
            working either way. Tour-request, question and password-reset emails are not affected,
            because they are the direct result of something you asked us to do.
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
            without them: the token that keeps you signed in, your in-progress quiz answers, and,
            for up to an hour, a note that you asked to save your quiz results before signing in.
            Signing out clears the quiz answers. Clearing your browser's site data removes all of
            them.
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
            Listing pages count views. The count is a single number per listing, shown to its
            Poster; we do not keep a list of who viewed what.
          </P>

          <H>11. Your email choices</H>
          <P>
            <strong>Service emails</strong> are the direct result of something you did: the tour
            request or question you asked us to send, your confirmation copy, and password-reset
            emails from our sign-in provider when you request one. You cannot opt out of these while
            using those features, because they are the feature.
          </P>
          <P>
            <strong>Saved-listing summary emails</strong> are optional. Turn them off with the switch
            on your profile or the unsubscribe link in any such email (see "Saved listings, notifications and alert emails" below).
          </P>
          <P>
            <strong>Promotional emails.</strong> We do not send any. If we ever start, we will ask
            first, every such email will carry an unsubscribe link, and saying no will not affect
            your account.
          </P>

          <H>12. How long we keep information</H>
          <UL>
            <li><strong>Your account, preferences, saved and hidden listings, quiz answers and notifications</strong> — for as long as your account exists. Deleting your account removes them.</li>
            <li><strong>Tour requests and questions</strong> — for as long as your account exists, because the Poster needs the record of who asked about their listing. When your account is deleted the records go with it. The copy already in the Poster's inbox is theirs and outside our control.</li>
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
            <li><strong>Correct it.</strong> You can edit your name, phone, preferences, sharing switches, the saved-listing email switch and (for Posters) licence details on your profile. Email us for anything you cannot change yourself.</li>
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
            user to the rows they are allowed to see. Access by our team is limited to what
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
