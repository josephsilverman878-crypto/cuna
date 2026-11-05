import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronDown, Mail } from 'lucide-react'

// /help — plain-language answers for renters, buyers and posters, and the
// one address to write to. Static: nothing here reads the database.

const CONTACT = 'hello@hellocuna.com'

const SECTIONS = [
  {
    id: 'renters',
    title: 'Renting',
    items: [
      ['Is Cuna free for renters?', 'Yes. Browsing, saving listings, saved searches, tour requests and questions are free. Cuna never charges an application fee.'],
      ['How do I find apartments?', 'Open the feed and set your filters: price, bedrooms, pets, amenities, neighborhoods or an area you draw on the map. Save the search to get an email when something new matches.'],
      ['What does a heart do?', 'A heart saves the listing to your Saved tab. It is private: the agent sees a count of saves, never who saved.'],
      ['How do I contact the agent?', 'Press "Request a tour" or "Ask a question" on a listing. Your name and email go to the agent with your message. Phone, move-in date, pets and credit range are shared only if you turned those on in your profile.'],
      ['What is net effective rent?', 'When a landlord offers free months on a lease, the net effective rent spreads that discount over the whole term. Cuna shows both the monthly rent you pay and the net effective figure so you can compare offers.'],
      ['Who pays the broker fee?', 'Under New York City’s FARE Act, a broker hired by the landlord cannot charge the tenant a fee. Every Cuna listing discloses every fee the tenant pays before you apply, and there is no tenant-paid broker fee option on Cuna.'],
      ['How big can a security deposit be?', 'New York State caps the security deposit at one month’s rent. Cuna will not publish a listing that asks for more.'],
    ],
  },
  {
    id: 'buyers',
    title: 'Buying',
    items: [
      ['Does Cuna list homes for sale?', 'Yes. Switch the feed to "Buy" to see condos, co-ops, townhouses and multi-family homes, with common charges, maintenance, taxes and the financing the building allows.'],
      ['Where do the recorded sales come from?', 'From NYC public records: the Department of Finance Rolling Sales file and ACRIS deeds, looked up by the building’s tax lot. Co-op sales are share transfers and often do not appear in those records; the page says so when it applies.'],
      ['What is the Market page?', 'Median sale prices and counts by neighborhood from the Department of Finance for the last twelve months, plus what is listed on Cuna right now. A figure is hidden when it rests on fewer than ten records.'],
    ],
  },
  {
    id: 'posters',
    title: 'Listing as an agent or owner',
    items: [
      ['Who can post?', 'Licensed New York real estate salespersons, associate brokers and brokers, and owners listing their own property. Sign up at /register/pro with your NY Department of State license number. Cuna checks it against the public licensee dataset and approves accounts by hand.'],
      ['What does a listing need?', 'At least three photos, every fee the tenant pays (0 is an answer, blank is not), a price in a sensible range, and a description about the home, not the tenant you want. The form checks all four before it posts.'],
      ['Can I post many listings at once?', 'Yes: Bulk upload on your dashboard takes a CSV. Download the template, fill it in, and read the row-by-row check before anything is created.'],
      ['What do I see about renters?', 'Counts of views and saves, and the leads who contacted you, with exactly what each renter chose to share. Cuna never shows who saved a listing.'],
      ['What is a team account?', 'A brokerage owner can add verified agents by email, then see and update every team listing from the Team page. Leads still go to the agent who posted.'],
      ['Why was my listing flagged or refused?', 'A second live listing at the same address and unit is refused outright. A listing priced far below comparable ones nearby, or using photos from another poster, is flagged for a human look; you can keep editing it.'],
    ],
  },
  {
    id: 'fair-housing',
    title: 'Fair housing and privacy',
    items: [
      ['What are the fair housing rules on Cuna?', 'Federal, New York State and New York City law prohibit housing discrimination on the basis of race, color, religion, national origin, sex, disability, familial status, age, sexual orientation, gender identity, marital status, military status, lawful source of income and other protected classes. Listings on Cuna describe the home, never the tenant. Descriptions are scanned before they post, and anyone can report a listing from its page.'],
      ['Can a landlord refuse a voucher?', 'No. Lawful source of income, including Section 8 and CityFHEPS, is protected in New York City and State. Cuna does not collect source-of-income information from anyone.'],
      ['What does Cuna collect about me?', 'What you type into your profile and listings, the searches you save, and anonymous view counts. The Privacy Policy lists everything; you can delete your account data by writing to us.'],
    ],
  },
]

export default function Help() {
  const navigate = useNavigate()
  const [open, setOpen] = useState({})
  const toggle = (k) => setOpen(o => ({ ...o, [k]: !o[k] }))

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '60px' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)', padding: '16px 24px',
        position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex' }}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, margin: 0 }}>Help</h1>
          <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>Answers for renters, buyers and posters</div>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div className="card" style={{ padding: '18px 20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Mail size={18} color="var(--terracotta)" />
          <div style={{ flex: 1, minWidth: '200px', fontSize: '14px', lineHeight: 1.5 }}>
            Can’t find it here? Write to <a href={`mailto:${CONTACT}`} style={{ color: 'var(--terracotta)', fontWeight: 600 }}>{CONTACT}</a>. A person reads every message.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SECTIONS.map(s => (
            <a key={s.id} href={'#' + s.id} style={{
              padding: '7px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, textDecoration: 'none',
              background: 'var(--white)', color: 'var(--charcoal-soft)', border: '1px solid var(--sand-dark)',
            }}>{s.title}</a>
          ))}
        </div>

        {SECTIONS.map(s => (
          <div key={s.id} id={s.id} className="card" style={{ padding: '6px 20px 10px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '21px', margin: '14px 0 6px' }}>{s.title}</h2>
            {s.items.map(([q, a], i) => {
              const k = s.id + i
              return (
                <div key={k} style={{ borderTop: '1px solid var(--sand-dark)' }}>
                  <button type="button" onClick={() => toggle(k)} aria-expanded={Boolean(open[k])} style={{
                    width: '100%', background: 'none', border: 'none', padding: '12px 0', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
                    fontSize: '14px', fontWeight: 600, color: 'var(--charcoal)',
                  }}>
                    {q}
                    <ChevronDown size={16} color="var(--warm-gray)" style={{ transform: open[k] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                  </button>
                  {open[k] && <p style={{ margin: '0 0 12px', fontSize: '14px', lineHeight: 1.6, color: 'var(--charcoal-soft)' }}>{a}</p>}
                </div>
              )
            })}
          </div>
        ))}

        <p style={{ fontSize: '12px', color: 'var(--warm-gray)', textAlign: 'center', lineHeight: 1.6 }}>
          <Link to="/terms" style={{ color: 'var(--warm-gray)' }}>Terms of Service</Link> · <Link to="/privacy" style={{ color: 'var(--warm-gray)' }}>Privacy Policy</Link> · <Link to="/market" style={{ color: 'var(--warm-gray)' }}>Market data</Link> · <Link to="/neighborhoods" style={{ color: 'var(--warm-gray)' }}>Neighborhoods</Link>
        </p>
      </div>
    </div>
  )
}
