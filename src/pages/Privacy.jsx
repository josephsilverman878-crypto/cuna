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

// Every statement here describes what the app on main actually does. Before
// changing a feature that touches personal data, update this page in the same
// change; before adding a feature, check cuna-security/privacy-future-sections.md
// for text already drafted for it.

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
            do on the Service, and whatever you choose to share in a tour request. Counts that are
            not tied to anyone, such as the number of times a listing has been viewed, are not
            personal information.
          </P>

          <H>2. What we collect, and why</H>
          <P><strong>Information you give us</strong></P>
          <UL>
            <li><strong>Account details</strong> — your email address, a password, your name, your cell phone number, whether you signed up as a Renter or a Poster, and the time you accepted our Terms and this policy. Your password is stored only in scrambled (hashed) form by our sign-in provider; we never see it. We use these to run your account, sign you in, and reach you about things you have asked us to do.</li>
            <li><strong>Poster licence details</strong> — if you sign up as a Poster: your name as it appears on your New York Department of State real estate licence, your licence number, your licence type (salesperson, broker, or owner without a licence), and your brokerage name if you give one. We use these to check that you may publish listings. Section 6 says who sees them.</li>
            <li><strong>Renter preferences</strong> — if you are a Renter, you can optionally tell us your budget range, bedrooms, minimum square footage, preferred neighborhoods, target move-in date, whether you have pets and what kind, and your credit score range. We use budget, bedrooms, square footage and neighborhoods to filter your feed when you turn filters on. Move-in date, pets and credit range are used for one thing only: they can be included in a tour request if the matching sharing switch is on (Section 5).</li>
            <li><strong>Sharing switches</strong> — four settings on your Renter profile that control what a tour request includes: phone number, move-in date, pets, and credit score range. Two start on (move-in date and pets) and two start off (phone number and credit score range). You can change any of them at any time.</li>
            <li><strong>Saved and hidden listings</strong> — the listings you save with the heart and the ones you hide from your feed. Saving is a private bookmark: the Poster is not told who saved a listing, only how many people did.</li>
            <li><strong>Tour requests</strong> — when you ask to tour a listing: whether you want an in-person or video tour, up to three preferred times, any message you write, and a record of exactly which optional details were included. Section 5 covers this in full.</li>
            <li><strong>"New to NY" quiz answers</strong> — if you take the optional neighborhood quiz, your answers about what you want from a place to live. Section 7 covers where they are kept.</li>
            <li><strong>Listings</strong> — if you are a Poster: the address, neighborhood, rent, fees, bedrooms, bathrooms, size, description, amenities, availability date and photos of each listing you post. Listings are public. Do not put anything in a listing that you would not want anyone on the internet to see.</li>
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
            <li>To send a tour request to the Poster of a listing when you ask us to, and a confirmation copy to you;</li>
            <li>To show Posters the tour requests, save counts and view counts for their own listings;</li>
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
            <li><strong>With the Poster of a listing, when you send a tour request.</strong> The Poster receives your name, the email address on your account, your tour type, times and message, and only those optional details whose sharing switch was on when you sent it. Section 5 lists exactly what is and is not included.</li>
            <li><strong>With Renters, if you are a Poster.</strong> Your listings and photos are public. A Renter who sends you a tour request learns your name and your email address, because our email to them names you and is addressed so that a reply goes to you. Your phone number, licence details and brokerage are not included.</li>
            <li><strong>With the public.</strong> Listings and their photos can be seen by anyone, with or without an account, including on the quiz results page.</li>
            <li><strong>With the companies that run the Service for us.</strong> Each sees only what it needs to do its job:
              <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                <li><strong>Supabase</strong> — our database, sign-in system and photo storage. It holds all account, listing and activity data and sends password-reset emails.</li>
                <li><strong>Vercel</strong> — hosts the website and runs the small function that sends tour-request emails. It keeps short-lived request logs.</li>
                <li><strong>Resend</strong> — delivers tour-request emails from hello@hellocuna.com. It handles the contents of each email in order to deliver it.</li>
                <li><strong>Google Fonts</strong> — the typefaces on the site load from Google's servers, so Google receives your IP address and browser details when a page loads.</li>
                <li><strong>Unsplash</strong> — when a listing has no photo, a placeholder image is loaded from Unsplash, which receives the same technical details.</li>
              </ul>
            </li>
            <li><strong>With our own team.</strong> Cuna administrators can see Poster licence details in order to verify them, and the people who operate the Service have access to the database to run and fix it. Access is limited to what the job needs.</li>
            <li><strong>When the law requires it.</strong> We may disclose information to comply with a law, subpoena or court order, or where we believe in good faith that it is necessary to protect the rights, safety or property of Cuna, our users or the public.</li>
            <li><strong>If Cuna changes hands.</strong> If Cuna LLC is merged, acquired, or sells all or part of its business, your information may be transferred to the new owner as part of that deal. This policy would keep applying to it, and we would tell you before your information became subject to a different one.</li>
          </UL>

          <H>5. Tour requests and the emails we send</H>
          <P>
            There is no messaging or matching on Cuna. The only way your details reach a Poster is
            when you press "Request a tour" on a listing and submit the form. Before you send, the
            form shows you exactly what will be shared.
          </P>
          <P>
            When you send, two emails go out from <strong>hello@hellocuna.com</strong>: one to the
            Poster of that listing, and a confirmation copy to you at the email address on your
            account. The email to the Poster contains:
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
            Your confirmation copy names the Poster and repeats what you sent. Each email is
            addressed so that a reply goes straight to the other person: the Poster's email carries
            your address as its reply-to, and your copy carries the Poster's address. If either of
            you replies, that reply travels by ordinary email between the two of you and does not
            pass through Cuna.
          </P>
          <P>
            We keep a record of each tour request, including a snapshot of exactly which optional
            details were included at the moment you sent it. The snapshot does not change
            afterwards: if you later switch a detail off, requests you already sent still show what
            you shared at the time, because the Poster already received it. Switching a detail off
            stops it being included in future requests. The Poster sees the same snapshot on their
            dashboard, next to your name, email and the times you offered.
          </P>
          <P>
            Email is not an encrypted medium, and once an email reaches the Poster's inbox it is
            outside our control. We cannot recall it or delete it for them. Resend, which delivers
            these emails for us, keeps delivery records for a limited time under its own terms.
          </P>

          <H>6. Poster licence information</H>
          <P>
            If you sign up as a Poster, we ask for the name on your New York Department of State
            real estate licence, your licence number and type, and your brokerage name. A Cuna
            administrator reviews these details and may check them against the public Department
            of State licence records. Until you are verified you can prepare listings but not
            publish them.
          </P>
          <P>
            <strong>Licence details are not shown to Renters or the public.</strong> A Renter who
            sends you a tour request learns your name and email address and nothing more; your
            phone number and brokerage are not included. You can view and update your licence
            details on your profile at any time.
          </P>

          <H>7. The "New to NY" quiz</H>
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

          <H>8. Automatic information and browser storage</H>
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
            to the website and to our email function (the address requested, the time, the result,
            your IP address and browser type). Supabase logs requests to the database, sign-in and
            photo storage. These logs are kept for short periods set by each provider, measured in
            hours or days, and we do not combine them with your account to track you.
          </P>
          <P>
            Listing pages count views. The count is a single number per listing, shown to its
            Poster; we do not keep a list of who viewed what.
          </P>

          <H>9. Your email choices</H>
          <P>
            <strong>Service emails</strong> are the direct result of something you did: the tour
            request you asked us to send, your confirmation copy, and password-reset emails from our
            sign-in provider when you request one. You cannot opt out of these while using those
            features, because they are the feature.
          </P>
          <P>
            <strong>Promotional emails.</strong> We do not send any. If we ever start, we will ask
            first, every such email will carry an unsubscribe link, and saying no will not affect
            your account.
          </P>

          <H>10. How long we keep information</H>
          <UL>
            <li><strong>Your account, preferences, saved and hidden listings, and quiz answers</strong> — for as long as your account exists. Deleting your account removes them.</li>
            <li><strong>Tour requests</strong> — for as long as your account exists, because the Poster needs the record of who asked to see their listing. When your account is deleted the records go with it. The copy already in the Poster's inbox is theirs and outside our control.</li>
            <li><strong>Listings</strong> — until the Poster deletes them. A paused or de-listed listing stays stored, but is not shown, until it is deleted. Deleting a listing also deletes the tour requests and saves attached to it.</li>
            <li><strong>Photos</strong> — deleting a listing removes it from Cuna; its photo files may remain in our storage until we clear them. Email us and we will remove them straight away.</li>
            <li><strong>Technical logs</strong> — hours to days, at our providers.</li>
            <li><strong>Backups</strong> — our database provider keeps no automatic backups on our current plan. If we take a copy of the database for safekeeping, information deleted afterwards can remain in that copy until the copy is replaced or discarded.</li>
          </UL>
          <P>
            We may keep limited information longer where the law requires it, to resolve a dispute,
            or to enforce our Terms, and we will tell you if that applies to your request.
          </P>

          <H>11. Your rights, and how to use them</H>
          <P>These apply to everyone who uses Cuna, wherever you live:</P>
          <UL>
            <li><strong>See your information.</strong> Ask us and we will send you a copy of the personal information we hold about you, in a common file format.</li>
            <li><strong>Correct it.</strong> You can edit your name, phone, preferences, sharing switches and (for Posters) licence details on your profile. Email us for anything you cannot change yourself.</li>
            <li><strong>Delete it.</strong> Email us from the address on your account and ask. We will delete your account and the personal information tied to it, as described in Section 10, except where we must keep something for a legal reason, and we will tell you if so.</li>
          </UL>
          <P>
            To make any request, email <strong>hello@hellocuna.com</strong> or write to Cuna LLC,
            433 Broadway, New York, NY 10013. We will confirm it is you by replying to the email
            address on your account, and we will respond within a reasonable time and tell you if
            we need longer. We will never treat you differently for making a request. Depending on
            where you live, your state's law may give you further rights, including the right to
            appeal a decision we make; use the same address for those.
          </P>

          <H>12. We do not sell your information</H>
          <P>
            We have never sold or rented personal information and we do not share it for
            advertising. There are no advertising trackers on the Service, so there is nothing to
            opt out of; if that ever changes, this policy will say so before it does.
          </P>

          <H>13. Children</H>
          <P>
            The Service is for people 18 and older. We do not knowingly collect personal information
            from anyone under 18, and in no event from children under 13. If we learn that we have,
            we will delete it. If you believe a minor has given us information, email us.
          </P>

          <H>14. Links to other sites</H>
          <P>
            The quiz results link to the New York City Department of Education's school search, and
            the "Tell us what you're looking for" button opens your own email app. Replies to
            tour-request emails happen in your and the Poster's own email services. Those sites and
            services have their own privacy practices, which we do not control.
          </P>

          <H>15. Security</H>
          <P>
            Passwords are stored hashed, connections use HTTPS, and database rules restrict each
            user to the rows they are allowed to see. Access by our team is limited to what
            operating the Service needs. No system is perfectly secure, so please use a strong,
            unique password and email us immediately if you suspect someone else has used your
            account.
          </P>

          <H>16. Users outside the United States</H>
          <P>
            The Service is operated from the United States, is intended for people looking for
            homes in New York, and stores information in the United States. If you use it from
            elsewhere, your information will be processed and stored there.
          </P>

          <H>17. Changes to this policy</H>
          <P>
            The date at the top is the date this version took effect. If we make a material change,
            we will tell you before it takes effect, by a notice on the Service or by email to the
            address on your account, and we will update the date. Using the Service after a change
            takes effect means you accept the updated policy.
          </P>

          <H>18. Contact</H>
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
