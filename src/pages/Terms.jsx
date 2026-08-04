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
            Last updated: [DATE]
          </p>

          <P>
            Welcome to Cuna. These Terms of Service ("Terms") govern your access to and use of the
            Cuna website, application, and services (collectively, the "Service"), operated by Cuna
            ("Cuna," "we," "us," or "our"). By creating an account or using the Service, you agree to
            these Terms. If you do not agree, do not use the Service.
          </P>
          <P>
            Your use of the Service is also governed by our{' '}
            <Link to="/privacy" style={{ color: 'var(--terracotta)', fontWeight: 600 }}>Privacy Policy</Link>,
            which describes how we collect and use your personal information.
          </P>

          <H>1. What Cuna Is (and Isn't)</H>
          <P>
            Cuna is a platform that connects people looking for rental apartments ("Renters") with
            people offering rental apartments ("Posters"), including licensed real estate agents and
            landlords.
          </P>
          <P><strong>Cuna is a listing and communication platform only.</strong> Cuna:</P>
          <UL>
            <li>Is <strong>not a party</strong> to any lease, rental agreement, or transaction between Renters and Posters;</li>
            <li>Does <strong>not</strong> act as a real estate broker, agent, or salesperson through the Service, and does not represent any user in any transaction;</li>
            <li>Does <strong>not</strong> verify, inspect, or guarantee any listing, apartment, price, fee, availability, or the identity, licensing, or conduct of any user (except where a feature explicitly states otherwise);</li>
            <li>Does <strong>not</strong> collect rent, deposits, or fees on behalf of any Poster.</li>
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
            You may register as a Renter or a Poster. You agree to use the Service only in the role(s)
            you have registered for.
          </P>

          <H>4. Poster Responsibilities</H>
          <P>If you post a listing, you represent and agree that:</P>
          <UL>
            <li>You are legally authorized to advertise the property (as owner, landlord's agent, or otherwise);</li>
            <li>All listing information — including rent, fees, photos, availability, and descriptions — is accurate, current, and not misleading;</li>
            <li>
              <strong>You are solely responsible for compliance with all applicable laws</strong>, including but not limited to:
              <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                <li>the <strong>NYC FARE Act</strong> (Local Law 119 of 2024), including its fee disclosure requirements and its restrictions on charging tenant-paid broker fees where the broker represents the landlord;</li>
                <li><strong>fair housing laws</strong> (the federal Fair Housing Act, the New York State Human Rights Law, and the New York City Human Rights Law), including prohibitions on discriminatory advertising and on discrimination based on lawful source of income;</li>
                <li>New York State real estate licensing law and advertising regulations, if you are a licensed agent or broker, including holding a current license registered with the New York Department of State, Division of Licensing Services;</li>
              </ul>
            </li>
            <li>Your listing is for a residential rental with a lease term of at least 30 days. Short-term rentals, vacation rentals, and offers of individual rooms for periods under 30 days are not permitted;</li>
            <li>You will not post more than one active listing for the same unit at the same time;</li>
            <li>You will promptly update or delist any listing that is no longer available or accurate.</li>
          </UL>
          <P>
            Cuna provides fields for disclosing fees (such as security deposit, application fee, and
            move-in fees) as a convenience. <strong>Providing these fields does not constitute legal
            advice, and completing them does not guarantee your compliance with the FARE Act or any
            other law.</strong> You are responsible for your own compliance.
          </P>

          <H>5. Renter Responsibilities</H>
          <P>If you use the Service as a Renter, you agree that:</P>
          <UL>
            <li>Information you provide in your profile and search preferences is accurate;</li>
            <li>You will independently verify any listing details (including fees, availability, and condition) before entering into any agreement;</li>
            <li>Cuna's display of listing information, including any fee breakdowns or totals, reflects information provided by the Poster and is not verified by Cuna.</li>
          </UL>

          <H>6. Acceptable Use</H>
          <P>You agree not to:</P>
          <UL>
            <li>Post false, misleading, discriminatory, or unlawful content, including listings that violate fair housing laws;</li>
            <li>Advertise a property you are not authorized to advertise;</li>
            <li>Harass, threaten, or abuse other users, including through the messaging feature;</li>
            <li>Use the Service to send spam or unsolicited commercial messages;</li>
            <li>Scrape, copy, or harvest data, listings, or user information from the Service;</li>
            <li>Attempt to circumvent security measures, access other users' accounts, or interfere with the operation of the Service;</li>
            <li>Impersonate any person or misrepresent your affiliation with any person or entity;</li>
            <li>Use the Service for any purpose other than seeking or offering residential rentals.</li>
          </UL>
          <P>
            We may remove content or suspend or terminate accounts that violate these Terms, at our
            discretion, with or without notice.
          </P>

          <H>7. Content You Submit</H>
          <P>
            You retain ownership of the content you submit to the Service (listings, photos,
            descriptions, messages, profile information). By submitting content, you grant Cuna a
            non-exclusive, worldwide, royalty-free license to host, store, display, and distribute that
            content as needed to operate and promote the Service.
          </P>
          <P>
            You represent that you have the rights to any content you submit (including photos) and
            that it does not infringe anyone else's rights.
          </P>

          <H>8. Third-Party Services and Content</H>
          <P>
            The Service is built on third-party infrastructure (such as hosting, database, and
            authentication providers). Links to third-party sites do not imply endorsement, and those
            sites have their own terms.
          </P>

          <H>9. Disclaimers</H>
          <P>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, EXPRESS
            OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT. CUNA DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE,
            OR SECURE, OR THAT ANY LISTING OR USER INFORMATION IS ACCURATE.
          </P>
          <P>Nothing in the Service constitutes legal, financial, or real estate advice.</P>

          <H>10. Limitation of Liability</H>
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

          <H>11. Indemnification</H>
          <P>
            You agree to indemnify and hold harmless Cuna and its owner, affiliates, and personnel from
            any claims, damages, liabilities, and expenses (including reasonable attorneys' fees)
            arising out of your content, your use of the Service, your violation of these Terms, or
            your violation of any law or the rights of any third party — including any claim arising
            from a listing you post or a transaction you enter into with another user.
          </P>

          <H>12. Termination</H>
          <P>
            You may stop using the Service at any time, and you may request deletion of your account
            and associated data by emailing <strong>Info@SLRGRP.com</strong>. We may suspend or
            terminate your access at any time, with or without cause or notice, including for
            violations of these Terms. Sections that by their nature should survive termination
            (including Sections 7, and 9–14) will survive.
          </P>

          <H>13. Changes to the Service or Terms</H>
          <P>
            We may modify the Service or these Terms at any time. If we make material changes to these
            Terms, we will provide notice (for example, by posting the updated Terms in the app with a
            new "Last updated" date, or by email). Your continued use of the Service after changes take
            effect constitutes acceptance of the updated Terms.
          </P>

          <H>14. Governing Law and Disputes</H>
          <P>
            These Terms are governed by the laws of the State of New York, without regard to
            conflict-of-laws principles. Any dispute arising out of these Terms or the Service will be
            brought exclusively in the state or federal courts located in New York County or Kings
            County, New York, and you consent to the jurisdiction of those courts.
          </P>

          <H>15. Miscellaneous</H>
          <P>
            These Terms, together with the Privacy Policy, are the entire agreement between you and
            Cuna regarding the Service. If any provision is found unenforceable, the rest remain in
            effect. Our failure to enforce any provision is not a waiver. You may not assign these
            Terms without our consent; we may assign them (for example, to a successor entity such as
            a newly formed LLC).
          </P>

          <H>16. Contact</H>
          <P>Questions about these Terms: <strong>Info@SLRGRP.com</strong></P>
        </div>
      </div>
    </div>
  )
}
