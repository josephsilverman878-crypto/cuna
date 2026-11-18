// Tests for the poster assistant (Fill from notes, Listing checkup, Posting
// help) and the web-search step of "Ask about this listing", with a
// stand-in model and store: no network, no API key, no database.
//   node --test tests/ai-poster.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { verifyFill, fillNotes, numbersIn } from '../api/_ai-fill.js'
import { buildFill } from '../src/lib/fillFromNotes.js'
import { postingHelp, HELP_TEXT, HELP_UNKNOWN, HELP_REFUSAL, checkHelp } from '../api/_ai-help.js'
import { checkup, stripSentences, checkRewrite } from '../api/_ai-checkup.js'
import { listingQa, checkWebAnswer, sentencesOf, supportedAnswer, QA_UNKNOWN } from '../api/_ai-listing-qa.js'
import { checkupItems, priceVsArea, referenceFor } from '../src/lib/listingCheckup.js'
import { scanAssistantOutput } from '../src/lib/fairHousing.js'

function reply(obj, { stop = 'end_turn', usage = { input_tokens: 1000, output_tokens: 200 } } = {}) {
  return { content: [{ type: 'text', text: typeof obj === 'string' ? obj : JSON.stringify(obj) }], stop_reason: stop, usage }
}
function fakeClient(queue) {
  const calls = []
  const next = async (params) => { calls.push(params); const r = queue.shift(); if (r instanceof Error) throw r; return r }
  return { calls, messages: { create: next }, beta: { messages: { create: next } } }
}
function fakeStore() {
  const s = {
    kind: 'fake', finished: [], logged: [], cache: new Map(),
    async takeSlot() { return { ok: true, id: s.finished.length + 1, spent: 0, global: 0 } },
    async finish(id, fields) { s.finished.push({ id, ...fields }) },
    async log(row) { s.logged.push(row) },
    async spent() { return { actor: 0, global: 0 } },
    async cacheGet(hash, dv) { const c = s.cache.get(hash); return c && c.dataVersion === dv ? c : null },
    async cacheSet(hash, v) { s.cache.set(hash, { output: v.output, model: v.model, dataVersion: v.dataVersion }) },
  }
  return s
}
const user = { kind: 'user', key: 'u1', userId: '00000000-0000-4000-8000-000000000001' }
const ctxOf = (client, store, extra = {}) => ({ client, store, actor: user, requestId: 'r1', env: {}, startedAt: Date.now(), ...extra })

const NOTES = `Hi Joseph, new one for you.
245 Example St, Apt 3B, Brooklyn 11215
2BR / 1.5 bath, about 850 sq ft. Asking $3,500/mo on a 12 month lease, one month free.
Deposit $3,500, no application fee. Amenity fee $75.
Cats ok. Dishwasher, elevator, laundry in building.
Broker fee 15%. Owner would like a quiet working couple, no kids.`

// ------------------------------------------------------------ fill from notes
test('numbers written in notes are read as numbers', () => {
  assert.deepEqual(numbersIn('$3,500/mo, 2BR, 1.5 bath, 3.5k, 1.2m, 12 month'), [3500, 2, 1.5, 3500, 1200000, 12])
})

test('only what the notes state survives; a guess with no real quote is thrown away', () => {
  const out = {
    fields: [
      { field: 'street_address', value: '245 Example St', quote: '245 Example St, Apt 3B' },
      { field: 'unit', value: 'Apt 3B', quote: 'Apt 3B' },
      { field: 'city', value: 'Brooklyn', quote: 'Brooklyn 11215' },
      { field: 'zip_code', value: '11215', quote: 'Brooklyn 11215' },
      { field: 'listing_type', value: 'rent', quote: 'Asking $3,500/mo' },
      { field: 'price', value: '3500', quote: 'Asking $3,500/mo' },
      { field: 'bedrooms', value: '2', quote: '2BR' },
      { field: 'bathrooms', value: '1.5', quote: '1.5 bath' },
      { field: 'sqft', value: '850', quote: 'about 850 sq ft' },
      { field: 'lease_term_months', value: '12', quote: '12 month lease' },
      { field: 'months_free', value: '1', quote: 'one month free' },
      { field: 'security_deposit', value: '3500', quote: 'Deposit $3,500' },
      { field: 'application_fee', value: '0', quote: 'no application fee' },
      { field: 'pets_policy', value: 'cats_only', quote: 'Cats ok' },
      // Guesses and inventions:
      { field: 'move_in_fee', value: '0', quote: 'no move-in fee' },                 // the notes never say this
      { field: 'available_date', value: '2026-12-01', quote: 'new one for you' },    // no date in the notes
      { field: 'sqft', value: '900', quote: 'about 850 sq ft' },                     // a second, different value
      { field: 'price', value: '3600', quote: 'Asking $3,500/mo' },                  // value is not in its quote
    ],
    amenities: [
      { amenity: 'dishwasher', quote: 'Dishwasher, elevator' },
      { amenity: 'elevator', quote: 'Dishwasher, elevator' },
      { amenity: 'laundry', quote: 'laundry in building' },
      { amenity: 'gym', quote: 'laundry in building' },   // the quote does not mention a gym
      { amenity: 'doorman', quote: 'doorman building' },  // not in the notes at all
    ],
    other_fees: [
      { description: 'Amenity fee', amount: '75', quote: 'Amenity fee $75' },
      { description: 'Broker fee', amount: '525', quote: 'Broker fee 15%' },
    ],
  }
  const v = verifyFill(out, NOTES)
  const got = Object.fromEntries(v.fields.map(f => [f.field, f.value]))
  assert.deepEqual(got, {
    street_address: '245 Example St', unit: 'Apt 3B', city: 'Brooklyn', zip_code: '11215', listing_type: 'rent',
    price: '3500', bedrooms: '2', bathrooms: '1.5', sqft: '850', lease_term_months: '12', months_free: '1',
    security_deposit: '3500', application_fee: '0', pets_policy: 'cats_only',
  })
  assert.equal(got.move_in_fee, undefined, 'a field the notes do not mention stays empty')
  assert.equal(got.available_date, undefined)
  assert.deepEqual(v.amenities.map(a => a.key), ['dishwasher', 'elevator', 'laundry'])
  assert.deepEqual(v.other_fees.map(f => f.description), ['Amenity fee'])
  assert.equal(v.broker_fee, true, 'a broker fee is never filled in (FARE Act)')
  assert.equal(v.dropped, 6)
})

test('edge cases: studio, half bath, a date needs its year, a lease in years, zero only when stated', () => {
  const notes = 'Studio with a half bath. Available December 1, 2026. 2 year lease. Deposit waived. $2,100. Available Jan 5.'
  const v = verifyFill({
    fields: [
      { field: 'bedrooms', value: '0', quote: 'Studio' },
      { field: 'bathrooms', value: '0.5', quote: 'a half bath' },
      { field: 'available_date', value: '2026-12-01', quote: 'Available December 1, 2026' },
      { field: 'lease_term_months', value: '24', quote: '2 year lease' },
      { field: 'security_deposit', value: '0', quote: 'Deposit waived' },
      { field: 'price', value: '2100', quote: '$2,100' },
    ], amenities: [], other_fees: [],
  }, notes)
  assert.deepEqual(Object.fromEntries(v.fields.map(f => [f.field, f.value])),
    { bedrooms: '0', bathrooms: '0.5', available_date: '2026-12-01', lease_term_months: '24', security_deposit: '0', price: '2100' })
  const noYear = verifyFill({ fields: [{ field: 'available_date', value: '2027-01-05', quote: 'Available Jan 5' }], amenities: [], other_fees: [] }, notes)
  assert.equal(noYear.fields.length, 0, 'a date without a year would be a guess')
  const zero = verifyFill({ fields: [{ field: 'application_fee', value: '0', quote: 'Deposit waived' }, { field: 'move_in_fee', value: '0', quote: '$2,100' }], amenities: [], other_fees: [] }, notes)
  assert.deepEqual(zero.fields.map(f => f.field), ['application_fee'], 'zero needs words that say there is none')
})

test('the handler sends the notes once, returns checked fields with remarks, and stores nothing', async () => {
  const model = {
    fields: [
      { field: 'street_address', value: '245 Example St', quote: '245 Example St' },
      { field: 'unit', value: 'Apt 3B', quote: 'Apt 3B' },
      { field: 'price', value: '3500', quote: 'Asking $3,500/mo' },
      { field: 'bedrooms', value: '3', quote: '2BR' },
    ],
    amenities: [{ amenity: 'dishwasher', quote: 'Dishwasher' }],
    other_fees: [],   // the model follows "never include a broker fee"; the remark must still appear
  }
  const client = fakeClient([reply(model)])
  const store = fakeStore()
  const r = await fillNotes(ctxOf(client, store), { notes: NOTES })
  assert.equal(r.ok, true); assert.equal(r.output.kind, 'fill')
  assert.equal(client.calls.length, 1)
  assert.equal(client.calls[0].model, 'claude-haiku-5-5')
  assert.match(client.calls[0].messages[0].content, /245 Example St/)
  assert.deepEqual(r.output.fields.map(f => f.field), ['street_address', 'unit', 'price'], 'bedrooms 3 is not what the notes say')
  assert.equal(r.output.remarks.length, 2, 'broker fee remark and the who-may-apply remark')
  assert.equal(store.cache.size, 0, 'notes and answers are never cached')
  assert.equal(JSON.stringify(store.finished).includes('Example St'), false, 'the usage log holds no content')
})

test('the poster tools need a signed-in person in production, and real notes', async () => {
  const client = fakeClient([])
  const visitor = { kind: 'ip', key: 'ip:x', userId: null }
  const anon = await fillNotes({ ...ctxOf(client, fakeStore()), actor: visitor, env: { VERCEL_ENV: 'production' } }, { notes: NOTES })
  assert.equal(anon.ok, false); assert.equal(anon.reason, 'sign_in')
  for (const run of [postingHelp, checkup]) {
    const r = await run({ ...ctxOf(client, fakeStore()), actor: visitor, env: { VERCEL_ENV: 'production' } }, { question: 'How many photos?', description: 'No kids. Two bedrooms with a dishwasher.' })
    assert.equal(r.reason, 'sign_in', 'production: poster tools need a signed-in person')
  }
  const short = await fillNotes(ctxOf(client, fakeStore()), { notes: 'hi' })
  assert.equal(short.output.kind, 'message')
  assert.equal(client.calls.length, 0)
})

test('the form patch never overwrites what the poster typed, and joins the unit to the address', () => {
  const empty = { address: '', city: '', zip_code: '', price: '', bedrooms: '', sqft: '', listing_type: 'rent', lease_term_months: '12', pets_policy: '', dishwasher: false, elevator: true, other_fees: [] }
  const output = {
    fields: [
      { field: 'street_address', value: '245 Example St', quote: '245 Example St' },
      { field: 'unit', value: 'Apt 3B', quote: 'Apt 3B' },
      { field: 'price', value: '3500', quote: '$3,500/mo' },
      { field: 'bedrooms', value: '2', quote: '2BR' },
      { field: 'lease_term_months', value: '24', quote: '2 year lease' },
    ],
    amenities: [{ key: 'dishwasher', quote: 'Dishwasher' }, { key: 'elevator', quote: 'elevator' }],
    other_fees: [{ description: 'Amenity fee', amount: '75', quote: 'Amenity fee $75' }],
  }
  const a = buildFill(output, empty)
  assert.equal(a.patch.address, '245 Example St, Apt 3B')
  assert.equal(a.patch.lease_term_months, '24', 'the form default of 12 counts as untouched')
  assert.equal(a.patch.dishwasher, true); assert.equal('elevator' in a.patch, false, 'already ticked')
  assert.deepEqual(a.patch.other_fees, [{ description: 'Amenity fee', amount: '75' }])
  assert.deepEqual(a.keys.sort(), ['address', 'bedrooms', 'dishwasher', 'lease_term_months', 'other_fees', 'price'])
  const typed = buildFill(output, { ...empty, price: '3400', bedrooms: '2' })
  assert.equal('price' in typed.patch, false); assert.deepEqual(typed.kept, ['Price'], 'a different typed value is kept and reported')
})

// ------------------------------------------------------------ posting help
test('the help text holds the Help page and the posting rules, and passes the fair-housing scan', () => {
  assert.match(HELP_TEXT, /At least three photos/)
  assert.match(HELP_TEXT, /Photos: at least 3 and at most 10/)
  assert.equal(scanAssistantOutput(HELP_TEXT).ok, true)
})

test('posting help answers from the help text, caches the answer, and points to the address when it has none', async () => {
  const client = fakeClient([
    reply({ answered: true, answer: 'You need at least 3 photos and can add up to 10. The first photo is the cover.' }),
    reply({ answered: false, answer: "I don't have that." }),
    reply({ answered: false, answer: "That's not something I can advise on." }),
  ])
  const store = fakeStore()
  const a = await postingHelp(ctxOf(client, store), { question: 'How many photos do I need?' })
  assert.equal(a.output.answered, true); assert.match(a.output.answer, /at least 3 photos/)
  const again = await postingHelp(ctxOf(client, store), { question: 'how many photos do I need?' })
  assert.equal(again.cached, true); assert.equal(client.calls.length, 1, 'a repeated question costs nothing')
  const b = await postingHelp(ctxOf(client, store), { question: 'Can I pay to boost my listing?' })
  assert.equal(b.output.answered, false); assert.equal(b.output.answer, HELP_UNKNOWN); assert.match(b.output.answer, /hello@hellocuna\.com/)
  const c = await postingHelp(ctxOf(client, store), { question: 'How do I only show it to couples without kids?' })
  assert.equal(c.output.answered, false); assert.equal(c.output.answer, HELP_REFUSAL)
  assert.equal(client.calls.every(p => p.tools === undefined), true, 'posting help never searches the web')
})

test('a help answer with a number the help text does not hold is redone, then replaced by the address', async () => {
  assert.match(checkHelp({ answer: 'You can upload 25 photos per listing.' }), /25/)
  const client = fakeClient([
    reply({ answered: true, answer: 'You can upload 25 photos per listing.' }),
    reply({ answered: true, answer: 'You can upload 40 photos per listing.' }),
  ])
  const r = await postingHelp(ctxOf(client, fakeStore()), { question: 'What is the photo limit?' })
  assert.equal(client.calls.length, 2)
  assert.equal(r.output.answered, false); assert.equal(r.output.answer, HELP_UNKNOWN)
})

// ------------------------------------------------------------ listing checkup
const FORM = {
  listing_type: 'rent', property_type: '', price: '3500', bedrooms: '2', bathrooms: '1', sqft: '850',
  security_deposit: '3500', application_fee: '0', move_in_fee: '0', pets_policy: 'allowed',
  description: 'Two-bedroom with a dishwasher and an elevator.', video_url: '', tour_3d_url: '',
}

test('a complete listing has nothing to fix', () => {
  assert.deepEqual(checkupItems({ form: FORM, photoCount: 3, neighborhoodName: 'Park Slope' }), [])
})

test('the checkup lists what is missing or weak, with a one-tap fix where there is one', () => {
  const form = { ...FORM, sqft: '', application_fee: '', security_deposit: '9000', pets_policy: '', description: 'Great for a young couple. No vouchers. Two bedrooms.' }
  const items = checkupItems({ form, photoCount: 1, neighborhoodName: 'Park Slope' })
  const by = Object.fromEntries(items.map(i => [i.id, i]))
  assert.equal(by.photos.level, 'must'); assert.equal(by.photos.fixes[0].tab, 3)
  assert.equal(by.fee_application_fee.level, 'must'); assert.deepEqual(by.fee_application_fee.fixes[0].set, { application_fee: '0' })
  assert.deepEqual(by.deposit_cap.fixes[0].set, { security_deposit: '3500' })
  assert.equal(by.pets.level, 'must')
  assert.equal(by.wording_blocked.level, 'must'); assert.equal(by.wording_blocked.fixes[0].reword, true)
  assert.equal(by.sqft.level, 'should', 'missing square footage is a suggestion, never a block')
  assert.equal(items.findIndex(i => i.level === 'should') > -1, true)
})

test('a price far from the area range is flagged with its source; an unknown area or a normal price is not', () => {
  assert.equal(referenceFor('Park Slope').name, 'Park Slope')
  assert.equal(referenceFor('Nowhere Heights'), null)
  assert.equal(priceVsArea({ ...FORM, price: '4800' }, 'Park Slope'), null)
  const low = priceVsArea({ ...FORM, price: '1500' }, 'Park Slope')
  assert.equal(low.direction, 'below'); assert.match(low.text, /\$4,150–\$5,600 a month/); assert.match(low.source, /StreetEasy published median asking rents/)
  const high = priceVsArea({ ...FORM, listing_type: 'sale', property_type: 'condo', price: '9000000' }, 'Park Slope')
  assert.equal(high.direction, 'above'); assert.match(high.source, /Department of Finance/)
  assert.equal(priceVsArea({ ...FORM, price: '1500' }, 'Nowhere Heights'), null)
  const item = checkupItems({ form: { ...FORM, price: '1500', security_deposit: '1500' }, photoCount: 3, neighborhoodName: 'Park Slope' })
  assert.deepEqual(item.map(i => [i.id, i.level]), [['price_area', 'should']])
})

test('the wording fix keeps the facts, must pass the scan, and falls back to removing the sentences', async () => {
  const original = 'Sunny two-bedroom with 850 square feet. Perfect for a young couple, no kids. Dishwasher and elevator.'
  assert.equal(stripSentences(original), 'Sunny two-bedroom with 850 square feet. Dishwasher and elevator.')
  assert.match(checkRewrite({ text: 'Sunny two-bedroom with 900 square feet and a dishwasher.' }, original), /900/)
  const good = fakeClient([reply({ text: 'Sunny two-bedroom with 850 square feet. Dishwasher and elevator in the building.' })])
  const a = await checkup(ctxOf(good, fakeStore()), { description: original })
  assert.equal(a.output.kind, 'rewrite'); assert.equal(scanAssistantOutput(a.output.text).ok, true); assert.equal(a.output.fallback, false)
  assert.match(good.calls[0].messages[0].content, /WORDING TO REMOVE/)
  const bad = fakeClient([reply({ text: 'Sunny two-bedroom, ideal for a young couple with no kids. 850 square feet.' }), reply({ text: 'A safe, family-friendly two-bedroom with 850 square feet.' })])
  const b = await checkup(ctxOf(bad, fakeStore()), { description: original })
  assert.equal(b.output.kind, 'rewrite'); assert.equal(b.output.fallback, true)
  assert.equal(b.output.text, 'Sunny two-bedroom with 850 square feet. Dishwasher and elevator.')
  const clean = await checkup(ctxOf(fakeClient([]), fakeStore()), { description: 'Two-bedroom with a dishwasher and an elevator.' })
  assert.equal(clean.output.kind, 'message')
})

// ------------------------------------------------------------ web search
const LISTING = {
  id: '11111111-1111-4111-8111-111111111111', listing_type: 'rent', status: 'active', address: '245 Example St', city: 'Brooklyn', state: 'NY', zip_code: '11215',
  price: 3500, bedrooms: 2, bathrooms: 1, amenities: ['Dishwasher'], pets_policy: 'allowed', neighborhood_id: null, updated_at: '2026-11-01',
}
const fakeDb = {
  rpc: async (name) => (name === 'get_listing_public' ? { data: LISTING, error: null } : { data: [], error: null }),
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
}
const cite = (url, title) => ({ type: 'web_search_result_location', url, title, cited_text: 'NYC Buildings record: the building at 245 Example St was finished in 1931 and has six floors.', encrypted_index: 'e' })
const webReply = (text, citations) => ({
  content: [
    { type: 'server_tool_use', id: 's1', name: 'web_search', input: { query: 'q' } },
    { type: 'web_search_tool_result', tool_use_id: 's1', content: [{ type: 'web_search_result', url: 'https://www.nyc.gov/b', title: 'NYC Buildings', encrypted_content: 'z' }] },
    { type: 'text', text, ...(citations ? { citations } : {}) },
  ],
  stop_reason: 'end_turn', usage: { input_tokens: 8000, output_tokens: 80, server_tool_use: { web_search_requests: 1 } },
})

test('web answers must cite a page or say they found nothing', () => {
  assert.equal(checkWebAnswer("I couldn't find that.", { sources: [] }), null)
  assert.match(checkWebAnswer('The building was finished in 1931.', { sources: [] }), /cite/)
  assert.equal(checkWebAnswer('According to the city, 1931.', { sources: [{ url: 'https://www.nyc.gov/b', title: 'x' }] }), null)
})

test('a web answer keeps only sentences that rest on a cited passage, at most three, each with its link', () => {
  assert.deepEqual(sentencesOf('It runs Sundays from 9 a.m. to 2 p.m. in its 2026 season. It is on 4th St. off 5th Avenue. Done.'),
    ['It runs Sundays from 9 a.m. to 2 p.m. in its 2026 season.', 'It is on 4th St. off 5th Avenue.', 'Done.'])
  const citations = [
    { url: 'https://marketspread.com/market/1', title: 'Park Slope Farmers Market - Marketspread', text: 'Down to Earth Park Slope Farmers Market. Market open Sundays, 9:00AM - 2:00PM, Year Round. 4th Street off 5th Avenue.' },
    { url: 'https://www.bklynlibrary.org/locations/park-slope', title: 'Park Slope Library', text: 'Park Slope Library, 431 6th Ave, Brooklyn, NY 11215. Hours vary.' },
  ]
  const text = 'Marketspread lists the Down to Earth Park Slope Farmers Market on 4th Street as open Sundays. ' +
    'According to state data, the Bartel-Pritchard Square Greenmarket at 205 Prospect Park West runs from May 3 to December 20. ' +
    'The Park Slope Library is at 431 6th Ave in Brooklyn. ' +
    'The listing gives only the ZIP code, so I cannot confirm which is nearest. ' +
    'The market sits near 5th Avenue in Park Slope. ' +
    'Sundays are the market days on 4th Street in Park Slope.'
  const r = supportedAnswer(text, citations, 3)
  assert.equal(r.answer, 'Marketspread lists the Down to Earth Park Slope Farmers Market on 4th Street as open Sundays. The Park Slope Library is at 431 6th Ave in Brooklyn. The market sits near 5th Avenue in Park Slope.')
  assert.deepEqual(r.sources.map(x => new URL(x.url).hostname), ['marketspread.com', 'www.bklynlibrary.org'], 'each kept sentence has its page; a sentence with no cited passage is not shown')
  assert.equal('text' in r.sources[0], false, 'the cited passage itself never leaves the server')
  assert.deepEqual(supportedAnswer('Nothing here matches.', citations), { answer: '', sources: [] })
})

test("Cuna's data goes first; the web is used only when it has no answer and search is on", async () => {
  const unknown = reply({ answered: false, answer: "I don't have that for this listing." })
  // Search off: the listing answer stands and no search tool is ever sent.
  const off = fakeClient([unknown])
  const r1 = await listingQa(ctxOf(off, fakeStore(), { db: fakeDb }), { listing_id: LISTING.id, question: 'What year was the building built?' })
  assert.equal(r1.output.answered, false); assert.equal(off.calls.length, 1); assert.equal(off.calls[0].tools, undefined)

  // Search on, and Cuna's data answers: no search.
  const env = { AI_WEB_SEARCH_ENABLED: 'true' }
  const known = fakeClient([reply({ answered: true, answer: 'The listing shows a monthly rent of $3,500.' })])
  const r2 = await listingQa(ctxOf(known, fakeStore(), { db: fakeDb, env }), { listing_id: LISTING.id, question: 'What is the rent?' })
  assert.equal(r2.output.answered, true); assert.equal(r2.output.web, undefined); assert.equal(known.calls.length, 1)

  // Search on, and Cuna's data has no answer: one search call, linked source.
  const on = fakeClient([unknown, webReply('According to NYC Buildings, the building was finished in 1931.', [cite('https://www.nyc.gov/b', 'NYC Buildings')])])
  const store = fakeStore()
  const r3 = await listingQa(ctxOf(on, store, { db: fakeDb, env }), { listing_id: LISTING.id, question: 'What year was the building built?' })
  assert.equal(on.calls.length, 2)
  assert.equal(on.calls[0].tools, undefined, 'the first call never searches')
  assert.equal(on.calls[1].tools[0].name, 'web_search'); assert.equal(on.calls[1].tools.length, 1, 'search only: no page fetching')
  assert.equal(r3.output.answered, true); assert.equal(r3.output.web, true)
  assert.deepEqual(r3.output.sources, [{ url: 'https://www.nyc.gov/b', title: 'NYC Buildings' }])
  assert.equal([...store.cache.values()].some(c => JSON.stringify(c).includes('1931')), false, 'a web answer is never stored')
  assert.equal(store.finished.at(-1).web_searches, 1)
})

test('a web answer with no cited page, a not-found, or steering wording falls back to "I don\'t have that"', async () => {
  const env = { AI_WEB_SEARCH_ENABLED: 'true' }
  const unknown = () => reply({ answered: false, answer: "I don't have that for this listing." })
  for (const second of [
    [webReply('The building was finished in 1931.')],                                                              // never cites
    [webReply("I couldn't find that.")],                                                                           // nothing found
    [webReply('It is a very safe block.', [cite('https://x.example/a', 'X')])],                                    // steering wording
  ]) {
    const client = fakeClient([unknown(), ...second])
    const r = await listingQa(ctxOf(client, fakeStore(), { db: fakeDb, env }), { listing_id: LISTING.id, question: 'Tell me about the building.' })
    assert.equal(r.output.answered, false); assert.equal(r.output.web, undefined)
    assert.match(r.output.answer, /I don't have that for this listing/)
    assert.equal(client.calls.length, 2, 'a web answer is never redone: one listing call, one search call')
    assert.equal(client.calls[1].tools[0].max_uses, 1, 'one search per answer')
  }
  // A question the assistant must decline is never sent to the web.
  const refused = fakeClient([reply({ answered: false, answer: "That's not something I can advise on." })])
  const r = await listingQa(ctxOf(refused, fakeStore(), { db: fakeDb, env }), { listing_id: LISTING.id, question: 'Is this a safe area?' })
  assert.equal(refused.calls.length, 1); assert.equal(r.output.answered, false)
  assert.notEqual(r.output.answer, QA_UNKNOWN)
})
