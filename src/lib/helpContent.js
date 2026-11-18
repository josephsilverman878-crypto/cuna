// The words of the /help page: plain-language answers for renters, buyers
// and posters, and the one address to write to. Kept in its own file so the
// page (src/pages/Help.jsx) and the poster assistant's "Posting help"
// (api/_ai-help.js) read exactly the same text.

export const CONTACT = 'hello@hellocuna.com'

export const SECTIONS = [
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
