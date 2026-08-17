// Fair housing language scanner.
//
// Scans free-text listing descriptions for phrases that violate (or edge
// toward violating) fair housing law. This is a best-effort text screen, not
// a legal opinion — it exists to catch the common, obvious phrasings before
// a listing goes live.
//
// scanDescription(text) -> { blocked: Hit[], flagged: Hit[] }
// Hit = { label, explain, phrase }

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Turns a plain-English phrase into a case-insensitive, word-boundary regex.
// Words within the phrase are joined with \s+ so minor whitespace variance
// ("no  kids") still matches.
function phraseToRegex(phrase) {
  const words = phrase.trim().split(/\s+/).map(escapeRegex)
  return new RegExp(`\\b${words.join('\\s+')}\\b`, 'i')
}

const CATEGORIES = [
  {
    label: 'Source of income',
    explain: 'NYC and NY State law protect lawful source of income — including Section 8, ' +
      'CityFHEPS, and other rental assistance vouchers. You cannot refuse or discourage ' +
      'applicants who plan to pay with a voucher or subsidy, and you cannot require cash-only ' +
      'or income-only payment.',
    severity: 'block',
    phrases: [
      'no section 8',
      'no section eight',
      'section 8 not accepted',
      'section eight not accepted',
      'no vouchers',
      'vouchers not accepted',
      'no dss',
      'no hasa',
      'no cityfheps',
      'no fheps',
      'no hra',
      'no housing assistance',
      'no housing subsidies',
      'no housing programs',
      'cash only',
      'income only',
      'working professionals only',
      'employed applicants only',
      'no public assistance',
    ],
  },
  {
    label: 'Familial status',
    explain: 'It is illegal to steer, discourage, or refuse applicants because they have or ' +
      'plan to have children. Describing a unit as adults-only, couples-only, or kid-free is a ' +
      'familial status violation, with narrow exceptions for legally qualified senior housing.',
    severity: 'block',
    phrases: [
      'no kids',
      'no children',
      'children not allowed',
      'children not permitted',
      'children not welcome',
      'adults only',
      'no family',
      'no families',
      'mature adults only',
      'singles only',
      'couples only',
    ],
  },
  {
    label: 'Disability',
    explain: 'Service animals and emotional support animals are not "pets" under fair housing ' +
      'law — a no-pets policy cannot be used to exclude them, and you cannot state a preference ' +
      'against disabled, wheelchair-using, or otherwise impaired applicants.',
    severity: 'block',
    phrases: [
      'no service animals',
      'no service dogs',
      'no emotional support animals',
      'no esa',
      'able-bodied',
      'able bodied',
      'no wheelchairs',
      'not suitable for disabled',
      'not suitable for handicapped',
      'not suitable for wheelchair',
    ],
  },
  {
    label: 'Race, religion, national origin',
    explain: 'You cannot state or imply a preference for (or against) applicants based on race, ' +
      'religion, national origin, ethnicity, or the language they speak. This includes ' +
      '"desirable neighbor" language tied to a religious institution or ethnic group.',
    severity: 'block',
    phrases: [
      'no foreigners',
      'no immigrants',
      'christians only',
      'christians preferred',
      'catholics only',
      'catholics preferred',
      'jewish only',
      'jewish preferred',
      'muslims only',
      'muslims preferred',
      'hindus only',
      'hindus preferred',
      'english speakers only',
      'spanish speakers only',
      'must speak english',
      'no blacks',
      'no asians',
      'no hispanics',
      'no latinos',
      'no arabs',
      'ideal for white',
      'ideal for black',
      'ideal for asian',
      'ideal for hispanic',
      'ideal for latino',
      'walking distance to church',
      'walking distance to synagogue',
      'walking distance to mosque',
    ],
  },
  {
    label: 'Sex, gender, marital status',
    explain: 'Listings cannot be limited to one sex or gender, and cannot exclude applicants ' +
      'for being unmarried, single parents, or otherwise outside a "married couple" mold.',
    severity: 'block',
    phrases: [
      'males only',
      'females only',
      'men only',
      'women only',
      'girls only',
      'boys only',
      'married couples only',
      'no single men',
      'no single women',
      'no single mothers',
      'no single fathers',
      'no single parents',
    ],
  },
  {
    label: 'Age framing',
    explain: 'Age-coded phrasing like this isn\'t always a violation on its own, but it can read ' +
      'as steering by age and is worth rewording — describe the unit or building, not the kind ' +
      'of person who should live there.',
    severity: 'flag',
    phrases: [
      'young professionals',
      'no students',
      'no seniors',
      'perfect for students',
      'perfect for retirees',
    ],
  },
]

// Flattened, precompiled list of { severity, label, explain, phrase, regex }.
const RULES = CATEGORIES.flatMap(({ label, explain, severity, phrases }) =>
  phrases.map(phrase => ({
    severity,
    label,
    explain,
    phrase,
    regex: phraseToRegex(phrase),
  }))
)

export function scanDescription(text) {
  const result = { blocked: [], flagged: [] }
  if (!text) return result

  const seenPhrases = new Set()

  for (const rule of RULES) {
    if (seenPhrases.has(rule.phrase)) continue
    if (!rule.regex.test(text)) continue

    seenPhrases.add(rule.phrase)
    const hit = { label: rule.label, explain: rule.explain, phrase: rule.phrase }

    if (rule.severity === 'block') {
      result.blocked.push(hit)
    } else {
      result.flagged.push(hit)
    }
  }

  return result
}

export default scanDescription
