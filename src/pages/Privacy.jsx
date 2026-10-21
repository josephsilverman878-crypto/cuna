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
            Last updated: October 19, 2026
          </p>

          <P>
            This Privacy Policy explains how Cuna ("Cuna," "we," "us," or "our") collects, uses,
            shares, and protects your information when you use the Cuna website, application, and
            related services (the "Service"). By using the Service, you agree to this Privacy Policy.
          </P>
          <P>
            Your use of the Service is also governed by our{' '}
            <Link to="/terms" style={{ color: 'var(--terracotta)', fontWeight: 600 }}>Terms of Service</Link>.
            If you have questions or requests about your information, contact us at{' '}
            <strong>Info@SLRGRP.com</strong>.
          </P>

          <H>1. Information We Collect</H>
          <P><strong>Information you provide to us:</strong></P>
          <UL>
            <li><strong>Account information</strong> — your email address, password (stored in encrypted form by our authentication provider), name, phone number, and whether you register as a Renter or a Poster.</li>
            <li><strong>Renter profile and search preferences</strong> — such as budget range, number of bedrooms, minimum square footage, and preferred neighborhoods.</li>
            <li><strong>Listings</strong> — if you are a Poster: property addresses, prices, fees, descriptions, photos, availability, and related listing details. Listings are shown to other users of the Service; do not include information in a listing that you don't want displayed publicly.</li>
            <li><strong>Poster licence information</strong> — if you are a Poster: the name on your New York Department of State licence, your licence number and type, and your brokerage name. See Section 5.</li>
            <li><strong>Tour requests</strong> — when you ask to tour a listing, the preferred times you offer, any message you write, and whichever of your contact and household details you have chosen to share. See Section 4.</li>
            <li><strong>Questions to Posters</strong> — if you use "Ask a question" on a listing, the question you write. Only your name and email travel with it. See Section 4.</li>
            <li><strong>Open house times</strong> — if you are a Poster: the dates and times you schedule, change or cancel for a listing. These are shown publicly with the listing.</li>
            <li><strong>"New to NY" quiz answers</strong> — if you take the optional neighborhood quiz, the answers you give about what you want in a place to live. See Section 6.</li>
            <li><strong>Saved-listing notifications</strong> — the alerts we create for you about listings you saved, and whether you have read them or been emailed about them. See Section 7.</li>
            <li><strong>Communications with us</strong> — anything you send to our contact email.</li>
          </UL>
          <P><strong>Information collected automatically:</strong></P>
          <UL>
            <li><strong>Activity on the Service</strong> — such as the listings you view, the ones you save, the ones you hide from your feed, the tour requests and questions you send, and when you use features of the Service. Saving a listing is private: it is a bookmark for you, and the Poster is not told that you saved it. We do use your saved listings to send you the notifications described in Section 7.</li>
            <li><strong>Technical and log information</strong> — such as IP address, browser and device type, and usage logs generated by our hosting and infrastructure providers in the ordinary course of operating the Service.</li>
          </UL>
          <P>We do not currently use advertising trackers or sell advertising based on your data.</P>

          <H>2. How We Use Your Information</H>
          <P>We use your information to:</P>
          <UL>
            <li>Create and maintain your account and authenticate you;</li>
            <li>Operate the core features of the Service — showing listings that match your search preferences, recording the listings you save and hide, and delivering your tour requests to the Poster of the listing;</li>
            <li>Display Poster listing information (including disclosed fees) to Renters;</li>
            <li>Send service emails, such as password reset emails, the tour requests and questions you ask us to send, and — if you leave it switched on — a summary email about changes to listings you saved (Section 7);</li>
            <li>Show you, under the bell in the app, changes to listings you saved: a new status, a new price, or an open house added, changed or cancelled;</li>
            <li>Verify that Posters hold a valid real estate licence before allowing them to publish listings;</li>
            <li>Respond to your questions, reports, and requests;</li>
            <li>Maintain the safety and integrity of the Service, including investigating suspected fraud, fake listings, or violations of our Terms of Service;</li>
            <li>Comply with legal obligations.</li>
          </UL>

          <H>3. How Your Information Is Shared</H>
          <P>We do <strong>not</strong> sell your personal information. We share information only in these circumstances:</P>
          <UL>
            <li><strong>With other users, as part of how the Service works.</strong> Your listings (if you are a Poster) are visible to Renters using the Service, including anyone browsing without an account. When you send a tour request, the Poster of that listing receives your name, your email address, the times you offered, your message, and whichever optional details you chose to share — and nothing else. When you ask a question, the Poster receives your name, your email address and the question — nothing else. Section 4 explains exactly what is and is not included.</li>
            <li><strong>With service providers.</strong> We use third-party infrastructure providers to operate the Service — including Supabase (database, authentication, and file storage), Vercel (hosting), and Resend (sending email). These providers process data on our behalf and are bound by their own security and privacy commitments.</li>
            <li><strong>For legal reasons.</strong> We may disclose information if required by law, subpoena, or court order, or where we believe disclosure is necessary to protect the rights, safety, or property of Cuna, our users, or the public.</li>
            <li><strong>In a business transfer.</strong> If Cuna's business is reorganized (for example, into a newly formed LLC), or is merged, acquired, or sold, your information may be transferred as part of that transaction. This Privacy Policy would continue to apply.</li>
          </UL>

          <H>4. Tour Requests and the Emails We Send</H>
          <P>
            There is no messaging or matching on Cuna. The only ways your details reach a Poster
            are when you press "Request a tour" on a listing and submit the form, or when you press
            "Ask a question" and send one.
          </P>
          <P>
            When you do, we send two emails from <strong>hello@hellocuna.com</strong>: one to the
            person who posted that listing, and a copy to you at the email address on your account.
            The email to the Poster contains:
          </P>
          <UL>
            <li>Your name and the email address on your account;</li>
            <li>The listing you are asking about, its address and price, and a link to it;</li>
            <li>Whether you want an in-person or virtual tour, the times you offered, and any message you wrote;</li>
            <li><strong>Only</strong> those optional details you have switched on in your Renter profile — your phone number, your move-in date, whether you have pets and any pet details, and your credit score range.</li>
          </UL>
          <P>
            Those four switches are off unless you turn them on, and they are the whole of what is
            optional. Nothing else from your profile is sent — not your budget, not your saved
            listings, not your search history, not your quiz answers. If a switch is off, that field
            is left out of the email entirely rather than sent as "not provided."
          </P>
          <P>
            Your copy confirms what was sent. Each email is addressed so that a reply goes straight
            to the other party: the Poster's email carries your address as its reply-to, and your
            copy carries the Poster's address as its reply-to. If either of you replies, that reply
            travels between the two of you by ordinary email and does not pass through Cuna.
          </P>
          <P>
            <strong>Asking a question</strong> works the same way with less in it: two emails from
            hello@hellocuna.com, one to the Poster and a copy to you, each addressed so a reply goes
            straight to the other party. A question carries only your name, the email address on
            your account, the listing, and the question you wrote. None of the four optional
            switches apply to questions, and nothing from your profile is attached. To keep the
            Service usable for Posters, we limit how many requests and questions one account can
            send in a short period; if you reach the limit you are told, and nothing is sent.
          </P>
          <P>
            We keep a record of each tour request and each question, including, for tour requests,
            a snapshot of exactly what was shared at the moment you sent it. That snapshot does not change afterwards: if you later switch a
            detail off, requests you already sent still show what you shared at the time, because the
            Poster already received it. Switching a detail off stops it being included in future
            requests.
          </P>
          <P>
            These emails are sent from <strong>hello@hellocuna.com</strong> and delivered by{' '}
            <strong>Resend</strong>, our email provider, acting on our behalf. Resend processes the
            contents of each email in order to deliver it. Email is not an encrypted medium, and
            once an email reaches the Poster's inbox it is outside our control — we cannot recall it
            or delete it for them.
          </P>

          <H>5. Poster Licence Information</H>
          <P>
            If you register as a Poster, we ask for the name on your New York Department of State
            real estate licence, your licence number and type, and your brokerage name. We collect
            this to check that you are licensed before you are allowed to publish a listing.
          </P>
          <P>
            A Cuna administrator reviews this information, and may check it against the public New
            York Department of State licence records. <strong>It is not shown to Renters.</strong>{' '}
            Renters who contact you about a listing see your name, email address and phone number —
            not your licence number, licence type or brokerage. You can view and update your licence
            details on your profile.
          </P>

          <H>6. The "New to NY" Quiz</H>
          <P>
            The neighborhood quiz is optional. You can take it without an account, and you do not
            have to take it to use anything else on Cuna.
          </P>
          <P>
            It asks only about <strong>what you want from a place to live</strong> — budget range,
            number of bedrooms, where you commute to and how long you will travel, how busy you want
            the streets to feel, how much you care about things like parks, transit and restaurants,
            and when you hope to move. It deliberately does not ask about your age, family status,
            children, job, income, nationality, religion, or anything else about who you are. Your
            answers are used to rank neighborhoods and to show listings within your budget, and for
            nothing else.
          </P>
          <P>Where your answers live depends on whether you save them:</P>
          <UL>
            <li><strong>While you are taking the quiz</strong> — your answers are held in your own browser's local storage so you can close the tab and pick up where you left off. They are not sent to us at this stage.</li>
            <li><strong>If you are signed in as a Renter and press "Save my results"</strong> — your answers are stored on your Cuna account, along with the date you saved them, so you can return to them on another device. Only you can read them. Posters cannot see them, and we do not use them to target you.</li>
            <li><strong>When you sign out</strong> — the copy held in that browser is cleared. A set of answers saved while signed in is tied to that account, so if someone else signs in on the same browser, your answers are not shown to them.</li>
          </UL>
          <P>
            Answers stored on your account stay there until you overwrite them by retaking the quiz,
            or until your account is deleted. To have them removed on their own, email{' '}
            <strong>Info@SLRGRP.com</strong>.
          </P>

          <H>7. Saved Listings, Notifications and Alert Emails</H>
          <P>
            When you save a listing, we use that save to tell you when something about it changes:
            when the Poster marks it In contract, Rented, Off-market or De-listed (or active again),
            when the price changes, and when an open house is added, changed or cancelled. Each of
            these appears as a notification under the bell in the app, visible only to you. We store
            each notification (the listing, what changed, when, and whether you have read it) on
            your account.
          </P>
          <P>
            <strong>Alert emails.</strong> If "Email me about saved listings" is switched on in your
            profile (it is on by default), we also send you a summary email, from
            hello@hellocuna.com, grouping the notifications you have not yet been emailed about. The
            email contains the same lines you see under the bell and links to the listings. We note
            on each notification when it was emailed, so you are not sent the same change twice.
            Posters are never told who received a notification.
          </P>
          <P>
            <strong>Turning alert emails off.</strong> Switch "Email me about saved listings" off in
            your profile, or use the unsubscribe link at the bottom of any alert email, which works
            without signing in and affects only alert emails. The bell in the app keeps working
            either way. Tour-request and question emails, and password-reset emails, are not
            affected by this switch because they are the direct result of something you asked us to
            do.
          </P>
          <P>
            <strong>Open houses</strong> are information a Poster chooses to publish about a
            listing. They are shown on the listing page and on the listing card to anyone who can see
            the listing, and are not tied to any person other than the Poster.
          </P>

          <H>8. Data Retention</H>
          <P>
            We keep your information for as long as your account is active or as needed to operate the
            Service. If you delete your account (or ask us to), we will delete your profile,
            search preferences, saved and hidden listings, quiz answers, tour requests, questions,
            notifications, open house schedules (if you are a Poster), and uploaded
            photos, except where we need to retain limited information to comply with legal
            obligations, resolve disputes, or enforce our agreements. We cannot delete a tour-request
            email from the inbox of a Poster who already received it.
          </P>

          <H>9. Your Choices and Rights</H>
          <UL>
            <li><strong>Access and update.</strong> You can view and update your profile and search preferences in the app, including the four switches that control what a tour request shares about you.</li>
            <li><strong>Delete your account and data.</strong> Email <strong>Info@SLRGRP.com</strong> from the email address on your account and request deletion. We will delete your account and associated personal information as described above, within a reasonable time.</li>
            <li><strong>Email communications.</strong> Service emails (such as password resets, and the tour requests and questions you send) are part of operating your account. Saved-listing alert emails are optional: switch them off in your profile or with the unsubscribe link in any alert email (Section 7). We do not currently send marketing emails; if we ever do, they will include an unsubscribe option.</li>
          </UL>
          <P>
            Depending on where you live, you may have additional privacy rights under applicable law.
            To exercise any privacy right, contact us at <strong>Info@SLRGRP.com</strong>.
          </P>

          <H>10. Security</H>
          <P>
            We take reasonable measures to protect your information, including encrypted password
            storage, access controls, and database-level security rules that restrict which users can
            read which data. No system is perfectly secure, however, and we cannot guarantee absolute
            security. Please use a strong, unique password and notify us immediately at{' '}
            <strong>Info@SLRGRP.com</strong> if you suspect unauthorized access to your account.
          </P>

          <H>11. Children's Privacy</H>
          <P>
            The Service is for users 18 and older. We do not knowingly collect personal information
            from anyone under 18 (and in no event from children under 13). If we learn we have
            collected personal information from someone under 18, we will delete it. If you believe a
            minor has provided us information, contact us at <strong>Info@SLRGRP.com</strong>.
          </P>

          <H>12. Users Outside the United States</H>
          <P>
            The Service is operated from the United States and intended for users in the United States.
            If you use the Service from elsewhere, you understand that your information will be
            processed and stored in the United States.
          </P>

          <H>13. Changes to This Policy</H>
          <P>
            We may update this Privacy Policy from time to time. If we make material changes, we will
            provide notice through the Service or by email, and update the "Last updated" date above.
            Your continued use of the Service after changes take effect constitutes acceptance of the
            updated policy.
          </P>

          <H>14. Contact</H>
          <P>Questions, requests, or concerns about your privacy: <strong>Info@SLRGRP.com</strong></P>
        </div>
      </div>
    </div>
  )
}
