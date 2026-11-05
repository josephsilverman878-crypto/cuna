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

export default function Terms() {
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
          Terms of Service
        </h1>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px' }}>
        <div className="card">
          <p style={{ fontSize: '13px', color: 'var(--warm-gray)', marginBottom: '20px' }}>
            Last updated: November 5, 2026
          </p>

          <P>
            Welcome to Cuna. These Terms of Service ("Terms") govern your access to and use of the
            Cuna website, application, and services (collectively, the "Service"), operated by{' '}
            <strong>Cuna LLC</strong> ("Cuna," "we," "us," or "our"). By creating an account or using
            the Service, you agree to these Terms. If you do not agree, do not use the Service.
          </P>
          <P>
            Your use of the Service is also governed by our{' '}
            <Link to="/privacy" style={{ color: 'var(--terracotta)', fontWeight: 600 }}>Privacy Policy</Link>,
            which describes how we collect and use your personal information.
          </P>

          <H>1. What Cuna Is (and Isn't)</H>
          <P>
            Cuna is a platform that connects people looking for a home to rent or buy ("Renters",
            whether renting or buying) with people offering homes for rent or sale ("Posters"),
            including licensed real estate agents, brokerages and owners. Renters browse listings and,
            when they want to see one or know more, send a tour request or a question that Cuna emails
            to the Poster. Renters can save listings and searches and be told when something changes,
            and may keep an optional rental application to share with a Poster when they choose.
            Cuna also publishes pages built from public records: building pages, neighborhood pages,
            market data and the optional "New to NY" neighborhood guide.
          </P>
          <P><strong>Cuna is a listing and introduction platform only.</strong> Cuna:</P>
          <UL>
            <li>Is <strong>not a party</strong> to any lease, rental agreement, or transaction between Renters and Posters;</li>
            <li>Does <strong>not</strong> act as a real estate broker, agent, or salesperson through the Service, and does not represent any user in any transaction;</li>
            <li>Does <strong>not</strong> verify, inspect, or guarantee any listing, apartment, price, fee, availability, or the identity or conduct of any user, beyond the licence check described in Section 4;</li>
            <li>Does <strong>not</strong> collect rent, deposits, or fees on behalf of any Poster, never asks you to pay anything through the Service, and charges no application fee;</li>
            <li>Is <strong>not</strong> a tenant-screening company or consumer reporting agency: a rental application on Cuna is information a Renter chose to write down and share, not a report Cuna prepared or verified.</li>
          </UL>
          <P>Any agreement you enter into with another user is solely between you and that user.</P>

          <H>2. Eligibility</H>
          <P>
            You must be at least 18 years old and able to form a legally binding contract to use the
            Service. By using the Service, you represent that you meet these requirements.
          </P>

          <H>3. Accounts</H>
          <P>
            You are responsible for the accuracy of the information you provide at signup, for
            maintaining the confidentiality of your login credentials, and for all activity under your
            account. Notify us immediately if you suspect unauthorized use of your account.
          </P>
          <P>
            You may register as a Renter or a Poster. Your role is set when you sign up and cannot be
            changed afterwards; to use the other role, create a separate account.
          </P>

          <H>4. Poster Responsibilities</H>
          <P>
            Before you can publish a listing, a Cuna administrator reviews the licence details you
            gave at signup and may check them against public New York Department of State records.
            Verification confirms that the details you gave match a licence record, and for owners
            that the property you named is recorded as yours; it is not an endorsement, and it does
            not make Cuna responsible for your conduct. The comparisons use public New York State and
            New York City datasets as they stand on the day; a person at Cuna makes the decision.
          </P>
          <P>If you post a listing, you represent and agree that:</P>
          <UL>
            <li>You are legally authorized to advertise the property (as owner, landlord's agent, or otherwise);</li>
            <li>All listing information — including rent, fees, photos, availability, and descriptions — is accurate, current, and not misleading;</li>
            <li>
              <strong>You are solely responsible for compliance with all applicable laws</strong>, including but not limited to:
              <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                <li>the <strong>NYC FARE Act</strong> (Local Law 119 of 2024), including its fee disclosure requirements and its restrictions on charging tenant-paid broker fees where the broker represents the landlord;</li>
                <li><strong>fair housing laws</strong> (the federal Fair Housing Act, the New York State Human Rights Law, and the New York City Human Rights Law), including prohibitions on discriminatory advertising and on discrimination based on lawful source of income;</li>
                <li>New York State real estate licensing law and advertising regulations, if you are a licensed agent or broker, including holding a current licence registered with the New York Department of State, Division of Licensing Services;</li>
              </ul>
            </li>
            <li>Your listing is for a residential rental with a lease term of at least 30 days. Short-term rentals, vacation rentals, and offers of individual rooms for periods under 30 days are not permitted;</li>
            <li>You will not post more than one active listing for the same unit at the same time (the Service refuses a second live listing at the same address and unit);</li>
            <li>Each listing you publish or edit will carry at least three photos that are yours to use, every fee the tenant pays (0 when there is none), a price within the Service's sensible range, and a description about the home, never about the tenant you want. The Service checks these before posting and may flag for review a listing priced far below comparable ones nearby or using photos already on another Poster's listing;</li>
            <li>For a home offered for sale, the asking price, common charges, maintenance, taxes and financing terms you post are accurate; a sale listing is an advertisement, not an offer, and the FARE Act's rental-fee rules do not apply to it;</li>
            <li>If you post many listings at once through the CSV upload, you are responsible for every row exactly as if you had typed it;</li>
            <li>If you create a brokerage team, you are responsible for the agents you add and may see and update their listings; if you join one, you accept that its owner can do so. Leads still go to the Poster who posted;</li>
            <li>Your public agent page describes your service and experience and nothing about the tenants you are looking for; Cuna may remove a bio that does not;</li>
            <li>If you signed up as an owner, the property address you give for verification is the property you actually own;</li>
            <li><strong>If a Renter shares a rental application with you</strong>, you will use it only to evaluate that Renter for that home, keep it confidential, not copy or forward it beyond the people who need it for that decision, delete any copies when the decision is made, and never use it to discriminate on any ground protected by law, including lawful source of income;</li>
            <li><strong>You will keep each listing's status current</strong> — Active, In contract, Rented, Off-market or De-listed — and change it as soon as the facts change. Listings cannot be deleted: De-listed is the final state, and every listing remains viewable at its own link with its status, the date it changed, its days on market and its last price change;</li>
            <li>Open house times you post are public. You will keep them accurate and cancel any that will not take place; cancelled times stay on record, marked cancelled;</li>
            <li>You will use the contact details a Renter sends you in a tour request or a question only to respond to that request or question.</li>
          </UL>
          <P>
            Cuna provides fields for disclosing fees (such as security deposit, application fee, and
            move-in fees) as a convenience. <strong>Providing these fields does not constitute legal
            advice, and completing them does not guarantee your compliance with the FARE Act or any
            other law.</strong> You are responsible for your own compliance.
          </P>

          <H>5. Renter Responsibilities, Tour Requests and Questions</H>
          <P>If you use the Service as a Renter, you agree that:</P>
          <UL>
            <li>Information you provide in your profile and preferences is accurate;</li>
            <li>You will independently verify any listing details (including fees, availability, and condition) before entering into any agreement;</li>
            <li>Cuna's display of listing information, including any fee breakdowns, net effective rent or totals, reflects information provided by the Poster and is not verified by Cuna;</li>
            <li>If you fill in a rental application, what you write is accurate, the documents are yours and may lawfully be shared, and you will not put a Social Security number, a bank or card number, or anyone else's personal information in it. You decide, request by request, whether to share it; Cuna never shares it for you and charges nothing for it.</li>
          </UL>
          <P>
            <strong>Tour requests and questions.</strong> When you send a tour request, Cuna emails
            the Poster your name, the email address on your account, your tour preferences and
            message, and any optional details whose sharing switch you have turned on, and sends you
            a confirmation copy. When you ask a question, Cuna emails the Poster your name, your
            email address and the question, and sends you a copy. The emails are addressed so that
            replies go directly between you and the Poster by ordinary email, outside Cuna. Once
            sent, an email cannot be recalled. The Privacy Policy describes exactly what is included.
          </P>
          <P>
            <strong>Limits.</strong> To protect Posters from floods, Cuna will not send more than 10
            tour requests and questions from one account in an hour, or more than 3 for the same
            listing in a day. A request over the limit is refused and nothing is sent.
          </P>

          <H>6. Neighborhood Guide, Building, Market and Neighborhood Pages, Public Data and Estimates</H>
          <P>
            The "New to NY" quiz, the neighborhood descriptions, the neighborhood cards, the
            building pages, the market page and the neighborhood pages are provided for general
            information only. They are not advice, not a recommendation to rent or buy anywhere, and
            not a decision about you.
          </P>
          <UL>
            <li><strong>Building pages</strong> show year built, number of apartments, floors and building class from the City's PLUTO dataset, recorded sales from the Department of Finance and ACRIS, and listings on Cuna. Public records can lag or contain errors; confirm anything that matters with the Poster or the records themselves.</li>
            <li><strong>Market data</strong> shows median recorded sale prices and counts by the Department of Finance's own neighborhood names for the last twelve months, and median asking prices of live Cuna listings. A figure is shown only when it rests on at least ten records. Medians describe a group of sales or listings, never a particular home, and are not appraisals.</li>
            <li><strong>Neighborhood pages</strong> list the subway stations, public schools and hospitals located inside a neighborhood's boundary as drawn by the City (2020 Neighborhood Tabulation Areas), by name and address only, with the listings on Cuna and the market figures above. Boundaries are approximate; school assignment depends on an exact address.</li>
          </UL>
          <UL>
            <li><strong>Price ranges are estimates, not appraisals or offers.</strong> Rent ranges are derived from publicly listed asking rents and sale ranges from publicly recorded sales, for the period noted on each card. They are rounded, can be out of date, and do not describe any particular apartment. Always confirm the actual price with the Poster or seller.</li>
            <li><strong>School, district and hospital information comes from public sources</strong> — the NYC Department of Education's school list as of the school year stated on the card (currently 2024–25), NYC Department of City Planning school-district boundaries, and the New York State Department of Health facility list. We list what is located within a neighborhood's boundaries as we have drawn them; those boundaries are approximate. School assignment depends on an exact address and the city's own rules. Confirm it with the Department of Education before relying on it. We publish names, grade spans, public or charter status and district numbers only, never ratings or rankings.</li>
            <li><strong>Commute times and neighborhood scores</strong> are our own general estimates for comparison between neighborhoods, not measurements for any address.</li>
          </UL>
          <P>
            Quiz results depend only on the preferences you choose to enter. You can retake the quiz
            at any time, and nobody is obliged to act on a result.
          </P>

          <H>7. Saved Listings and Notifications</H>
          <P>
            Saving a listing is a private bookmark; the Poster sees only how many people saved a
            listing, never who. Saving a search works the same way: you are told when new listings
            match it, and Posters see only counts of saved searches by neighborhood, bedrooms and
            price band, for groups of three or more. When a listing you saved changes in any way — status, price, fees,
            available date, open houses, or its details — Cuna tells you under the bell in the app.
            Saving a listing also signs you up for email summaries of its changes, sent only when
            something has changed and at most twice a day; unsaving the listing stops them, and every
            such email links to your Saved listings. Notifications are informational: they are not a
            promise that a listing is or will be available, and we may change or discontinue them.
          </P>

          <H>8. Acceptable Use</H>
          <P>You agree not to:</P>
          <UL>
            <li>Post false, misleading, discriminatory, or unlawful content, including listings that violate fair housing laws;</li>
            <li>Advertise a property you are not authorized to advertise;</li>
            <li>Harass, threaten, or abuse other users, including in a tour request, a question, a listing, an open house time, or in email replies that begin with a tour request or question;</li>
            <li>Use tour requests or questions, or the contact details received through them, to send spam or unsolicited commercial messages, or try to get around the sending limits;</li>
            <li>Scrape, copy, or harvest data, listings, or user information from the Service;</li>
            <li>Use photos, descriptions or details from another Poster's listing, or post a listing for a home you do not control;</li>
            <li>Use a rental application a Renter shared with you for anything other than evaluating that Renter for that home, or keep it after the decision;</li>
            <li>Report a listing you know to be accurate, or use reports to harass a Poster;</li>
            <li>Attempt to circumvent security measures, access other users' accounts, or interfere with the operation of the Service;</li>
            <li>Impersonate any person or misrepresent your affiliation with any person or entity;</li>
            <li>Use the Service for any purpose other than seeking or offering homes to rent or buy.</li>
          </UL>
          <P>
            We may remove content or suspend or terminate accounts that violate these Terms, at our
            discretion, with or without notice.
          </P>

          <H>9. Content You Submit</H>
          <P>
            You retain ownership of the content you submit to the Service (listings, photos,
            descriptions, open house times, tour-request messages, questions, profile information). By submitting content, you
            grant Cuna a non-exclusive, worldwide, royalty-free license to host, store, display, and
            distribute that content as needed to operate and promote the Service.
          </P>
          <P>
            You represent that you have the rights to any content you submit (including photos) and
            that it does not infringe anyone else's rights.
          </P>

          <H>10. Third-Party Services and Content</H>
          <P>
            The Service is built on third-party infrastructure (hosting, database, sign-in, email
            delivery, a scheduled job for summary emails, maps and address lookups, and fonts), named
            in the Privacy Policy, and reads public datasets from New York City and New York State
            for maps, verification checks and the building, market and neighborhood pages. If sign-in
            with Google or Apple is offered, your use of it is also subject to their terms. The Service links to outside sites,
            such as the New York City Department of Education's school search, and the "Tell us what
            you're looking for" button opens your own email application. Links do not imply
            endorsement, and those sites and services have their own terms.
          </P>

          <H>11. Disclaimers</H>
          <P>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, EXPRESS
            OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT. CUNA DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE,
            OR SECURE, OR THAT ANY LISTING, USER INFORMATION, PRICE RANGE, NEIGHBORHOOD INFORMATION OR
            QUIZ RESULT IS ACCURATE, COMPLETE OR CURRENT.
          </P>
          <P>Nothing in the Service constitutes legal, financial, or real estate advice.</P>

          <H>12. Limitation of Liability</H>
          <P>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, CUNA WILL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR
            GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE — INCLUDING ANY DISPUTE,
            TRANSACTION, OR INTERACTION BETWEEN USERS — EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
            DAMAGES.
          </P>
          <P>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, CUNA'S TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF
            OR RELATING TO THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID CUNA IN
            THE TWELVE MONTHS BEFORE THE CLAIM AROSE, OR (B) ONE HUNDRED U.S. DOLLARS ($100).
          </P>
          <P>Some jurisdictions do not allow certain limitations, so some of the above may not apply to you.</P>

          <H>13. Indemnification</H>
          <P>
            You agree to indemnify and hold harmless Cuna LLC and its members, managers, affiliates,
            and personnel from any claims, damages, liabilities, and expenses (including reasonable
            attorneys' fees) arising out of your content, your use of the Service, your violation of
            these Terms, or your violation of any law or the rights of any third party — including
            any claim arising from a listing you post or a transaction you enter into with another
            user.
          </P>

          <H>14. Termination</H>
          <P>
            You may stop using the Service at any time, and you may request deletion of your account
            and associated data by emailing <strong>hello@hellocuna.com</strong>. We may suspend or
            terminate your access at any time, with or without cause or notice, including for
            violations of these Terms. Sections that by their nature should survive termination
            (including Sections 9 and 11–16) will survive.
          </P>

          <H>15. Changes to the Service or Terms</H>
          <P>
            We may modify the Service or these Terms at any time. If we make material changes to these
            Terms, we will provide notice (for example, by posting the updated Terms in the app with a
            new "Last updated" date, or by email). Your continued use of the Service after changes take
            effect constitutes acceptance of the updated Terms.
          </P>

          <H>16. Governing Law and Disputes</H>
          <P>
            These Terms are governed by the laws of the State of New York, without regard to
            conflict-of-laws principles. Any dispute arising out of these Terms or the Service will be
            brought exclusively in the state or federal courts located in New York County or Kings
            County, New York, and you consent to the jurisdiction of those courts.
          </P>

          <H>17. Miscellaneous</H>
          <P>
            These Terms, together with the Privacy Policy, are the entire agreement between you and
            Cuna regarding the Service. If any provision is found unenforceable, the rest remain in
            effect. Our failure to enforce any provision is not a waiver. You may not assign these
            Terms without our consent; we may assign them to a successor to our business.
          </P>

          <H>18. Contact</H>
          <P>Questions about these Terms:</P>
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
