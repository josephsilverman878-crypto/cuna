// "New to NY?" quiz questions, kept as data so copy can change without touching UI.
//
// STRICT RULE — this quiz asks about PREFERENCES ONLY.
// Never add a question (or an option, or helper text) about age, family status,
// children, occupation, student status, income, nationality, religion, safety,
// crime, schools, or who lives in a neighborhood. Ask what someone wants from a
// place to live, never who they are. Anything that sorts people rather than
// places is a fair housing problem, not a product decision.
//
// ANSWER SHAPES, by question type:
//   single  -> the chosen option's id, e.g. 'rent'
//             (exception: `budget` stores { id, min, max } — see below)
//   multi   -> array of option ids, e.g. ['condo', 'coop']
//   matrix  -> object of row id -> option id, e.g. { nightlife: 'must_have' }
//
// Budget is the one single-choice question that stores an object, because the
// numeric range is what later steps actually match against. `max: null` means
// "no upper bound".

export const STORAGE_KEY = 'cuna_newtony_answers'

export const PRIORITY_OPTIONS = [
  { id: 'not_important', label: 'Not important' },
  { id: 'nice_to_have', label: 'Nice to have' },
  { id: 'must_have', label: 'Must have' },
]

export const QUESTIONS = [
  {
    id: 'tenure',
    type: 'single',
    prompt: 'Are you renting or buying?',
    options: [
      { id: 'rent', label: 'Renting' },
      { id: 'buy', label: 'Buying' },
    ],
  },

  {
    id: 'budget',
    type: 'single',
    prompt: "What's your budget?",
    // Option set depends on the tenure answer. Both sets store numeric min/max.
    optionsBy: {
      key: 'tenure',
      rent: [
        { id: 'under_2000', label: 'Under $2,000', value: { min: 0, max: 2000 } },
        { id: '2000_2800', label: '$2,000 – $2,800', value: { min: 2000, max: 2800 } },
        { id: '2800_3800', label: '$2,800 – $3,800', value: { min: 2800, max: 3800 } },
        { id: '3800_5000', label: '$3,800 – $5,000', value: { min: 3800, max: 5000 } },
        { id: '5000_plus', label: '$5,000 and up', value: { min: 5000, max: null } },
      ],
      buy: [
        { id: 'under_500k', label: 'Under $500k', value: { min: 0, max: 500000 } },
        { id: '500k_800k', label: '$500k – $800k', value: { min: 500000, max: 800000 } },
        { id: '800k_1_2m', label: '$800k – $1.2M', value: { min: 800000, max: 1200000 } },
        { id: '1_2m_2m', label: '$1.2M – $2M', value: { min: 1200000, max: 2000000 } },
        { id: '2m_plus', label: '$2M and up', value: { min: 2000000, max: null } },
      ],
    },
    helperBy: {
      key: 'tenure',
      rent: 'Monthly rent, before utilities.',
      buy: 'Purchase price.',
    },
  },

  {
    id: 'size',
    type: 'single',
    prompt: 'How much space do you need?',
    options: [
      { id: 'studio', label: 'Studio' },
      { id: 'one_bed', label: '1 bedroom' },
      { id: 'two_bed', label: '2 bedrooms' },
      { id: 'three_plus', label: '3+ bedrooms' },
    ],
  },

  {
    id: 'property_types',
    type: 'multi',
    prompt: 'Which of these would you consider?',
    helper: 'Pick as many as you like.',
    showIf: answers => answers.tenure === 'buy',
    options: [
      { id: 'condo', label: 'Condo' },
      {
        id: 'coop',
        label: 'Co-op',
        helper: 'Co-ops have a board approval process and often require more cash reserves.',
      },
      { id: 'townhouse_multifamily', label: 'Townhouse or multi-family' },
      { id: 'not_sure', label: 'Not sure yet', exclusive: true },
    ],
  },

  {
    id: 'commute_to',
    type: 'single',
    prompt: 'Where will you be heading most days?',
    options: [
      { id: 'midtown', label: 'Midtown Manhattan' },
      { id: 'downtown_fidi', label: 'Downtown / Financial District' },
      { id: 'brooklyn', label: 'Brooklyn' },
      { id: 'queens', label: 'Queens' },
      { id: 'remote', label: 'Remote — no regular destination' },
    ],
  },

  {
    id: 'commute_max',
    type: 'single',
    prompt: "What's the longest commute you'd take?",
    options: [
      { id: '20', label: 'About 20 minutes' },
      { id: '30', label: 'About 30 minutes' },
      { id: '45', label: 'About 45 minutes' },
      { id: '60_plus', label: '60 minutes or more' },
      { id: 'no_preference', label: "Doesn't matter" },
    ],
  },

  {
    id: 'pace',
    type: 'single',
    prompt: 'What pace suits you?',
    helper: 'How busy the streets feel, day to day.',
    options: [
      { id: 'very_quiet', label: 'Very quiet' },
      { id: 'fairly_quiet', label: 'Fairly quiet' },
      { id: 'balanced', label: 'A balance of both' },
      { id: 'fairly_lively', label: 'Fairly lively' },
      { id: 'very_lively', label: 'Very lively' },
    ],
  },

  {
    id: 'priorities',
    type: 'matrix',
    prompt: 'How much do these matter to you?',
    // Row ids match the scored dimension keys in lib/neighborhoods.js.
    rows: [
      { id: 'nightlife', label: 'Nightlife' },
      { id: 'dining', label: 'Restaurants and cafés' },
      { id: 'green_space', label: 'Parks and green space' },
      { id: 'walkability', label: 'Walkability' },
      { id: 'transit_access', label: 'Subway access' },
    ],
    options: PRIORITY_OPTIONS,
  },

  {
    id: 'car',
    type: 'single',
    prompt: 'Do you have a car, or plan to get one?',
    options: [
      { id: 'no_car', label: 'No car' },
      { id: 'maybe', label: 'Maybe someday' },
      { id: 'yes_parking', label: 'Yes — I need parking or easy street access' },
    ],
  },

  {
    id: 'home_style',
    type: 'multi',
    prompt: 'Any home styles you love?',
    helper: 'Pick as many as you like.',
    options: [
      { id: 'prewar', label: 'Prewar character' },
      { id: 'brownstone_rowhouse', label: 'Brownstone or row house' },
      { id: 'new_construction', label: 'Modern new construction' },
      { id: 'no_preference', label: 'No preference', exclusive: true },
    ],
  },

  {
    id: 'timeline',
    type: 'single',
    prompt: 'When are you hoping to move?',
    options: [
      { id: 'within_30_days', label: 'Within 30 days' },
      { id: 'one_to_three_months', label: '1 – 3 months' },
      { id: 'three_plus_months', label: '3+ months out' },
      { id: 'exploring', label: 'Just exploring' },
    ],
  },
]

// Questions that apply given the answers so far. Branching lives here, not in the UI.
export function getVisibleQuestions(answers = {}) {
  return QUESTIONS.filter(q => !q.showIf || q.showIf(answers))
}

// Options for a question, resolving any answer-dependent set.
export function getOptions(question, answers = {}) {
  if (question.optionsBy) {
    const branch = answers[question.optionsBy.key]
    return question.optionsBy[branch] || []
  }
  return question.options || []
}

// Helper text for a question, resolving any answer-dependent copy.
export function getHelper(question, answers = {}) {
  if (question.helperBy) {
    const branch = answers[question.helperBy.key]
    return question.helperBy[branch] || ''
  }
  return question.helper || ''
}

// True when the question has enough of an answer to move on.
export function isAnswered(question, answers = {}) {
  const a = answers[question.id]
  if (question.type === 'multi') return Array.isArray(a) && a.length > 0
  if (question.type === 'matrix') return question.rows.every(r => a && a[r.id])
  return a !== undefined && a !== null && a !== ''
}

// Answers whose question no longer applies, e.g. property types after switching
// from buying to renting. Keeps saved state from going stale behind a branch.
export function pruneAnswers(answers = {}) {
  const visible = new Set(getVisibleQuestions(answers).map(q => q.id))
  const next = {}
  for (const [key, value] of Object.entries(answers)) {
    if (visible.has(key)) next[key] = value
  }
  return next
}

// Flat, readable summary of the answers — [{ id, prompt, value }].
// Used by the results placeholder; also handy for debugging.
export function describeAnswers(answers = {}) {
  return getVisibleQuestions(answers).map(q => {
    const a = answers[q.id]
    const opts = getOptions(q, answers)
    const labelFor = id => opts.find(o => o.id === id)?.label || id

    let value = 'Not answered'
    if (q.type === 'multi' && Array.isArray(a) && a.length) {
      value = a.map(labelFor).join(', ')
    } else if (q.type === 'matrix' && a) {
      value = q.rows
        .map(r => `${r.label}: ${PRIORITY_OPTIONS.find(o => o.id === a[r.id])?.label || '—'}`)
        .join(' · ')
    } else if (a && typeof a === 'object' && a.id) {
      value = labelFor(a.id)
    } else if (a) {
      value = labelFor(a)
    }

    return { id: q.id, prompt: q.prompt, value }
  })
}
