// Neighborhood matching for the "New to NY?" quiz.
//
// FAIR HOUSING — non-negotiable, and the reason this file is written the way it is.
//
// The matcher may read ONLY two things: the user's quiz answers, and the data
// fields on a neighborhood record. It must never infer, store, or mention
// anything about who the user is — age, family status, children, occupation,
// student status, income beyond the budget band they picked, national origin,
// religion, or any other protected characteristic — and it must never describe
// or imply who lives in a neighborhood.
//
// Every reason and caveat below is a template that pairs ONE stated preference
// with ONE dataset field, so any sentence shown to a user can be traced back to
// something they said plus something we recorded about the place. Do not add a
// template that describes people. Banned from this file's output: "safe",
// "family-friendly", "young", "professional", "desirable", "up-and-coming",
// "good schools", and anything of that shape.
//
// The function is pure: same answers in, same order out. No clock, no random,
// no network, no React.

const DIMENSIONS = ['nightlife', 'dining', 'green_space', 'walkability', 'transit_access']

// Scoring weights, gathered here so the balance is visible in one place.
// Budget is deliberately the largest single term AND a hard filter.
const W = {
  BUDGET_FULL: 40,
  BUDGET_PARTIAL: 22,
  COMMUTE_WITHIN: 12,
  COMMUTE_OVER: 12, // subtracted
  PACE_STEP: 4, // (4 - distance) * step, so 0-16
  PRIORITIES: 30, // scaled by how much the user actually asked for
  CAR: 10,
  STYLE_EACH: 4,
  STYLE_MAX: 8,
}

const PACE_VALUE = {
  very_quiet: 1, fairly_quiet: 2, balanced: 3, fairly_lively: 4, very_lively: 5,
}
const PACE_WANTED = {
  1: 'a very quiet neighborhood',
  2: 'a fairly quiet neighborhood',
  3: 'a balance of quiet and lively',
  4: 'a fairly lively neighborhood',
  5: 'a very lively neighborhood',
}
const PACE_IS = {
  1: 'mostly quiet residential blocks',
  2: 'quiet on the side streets, busier on its main avenues',
  3: 'a mix of quiet blocks and busy retail streets',
  4: 'busy streets with activity into the evening',
  5: 'busy well past midnight',
}

const PRIORITY_WEIGHT = { must_have: 3, nice_to_have: 1, not_important: 0 }

const DIMENSION_LABEL = {
  nightlife: 'nightlife',
  dining: 'restaurants and cafés',
  green_space: 'parks and green space',
  walkability: 'walkability',
  transit_access: 'subway access',
}

// 3+ bedrooms falls back to the two-bedroom range; the caveat says so.
const SIZE_KEY = { studio: 'studio', one_bed: 'one_bed', two_bed: 'two_bed', three_plus: 'two_bed' }
const SIZE_LABEL = {
  studio: 'Studios', one_bed: 'One-bedrooms', two_bed: 'Two-bedrooms', three_plus: 'Two-bedrooms',
}
const PROPERTY_LABEL = {
  condo: 'Condos', coop: 'Co-ops', townhouse_multifamily: 'Townhouses and multi-family homes',
}
const STYLE_LABEL = {
  prewar: 'prewar buildings',
  brownstone_rowhouse: 'brownstones and row houses',
  new_construction: 'new construction',
}
const DESTINATION_LABEL = { midtown: 'Midtown', downtown_fidi: 'the Financial District' }
const ALL_SALE_TYPES = ['condo', 'coop', 'townhouse_multifamily']

function money(n) {
  return '$' + Number(n).toLocaleString('en-US')
}

function price(n) {
  if (n >= 1000000) {
    const m = n / 1000000
    return '$' + (Number.isInteger(m) ? m : m.toFixed(1)) + 'M'
  }
  return '$' + Math.round(n / 1000) + 'k'
}

function joinWords(list) {
  if (list.length <= 1) return list[0] || ''
  if (list.length === 2) return `${list[0]} and ${list[1]}`
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`
}

// 'full'  = the whole typical range sits inside the budget
// 'partial' = only the low end fits, so it is a stretch
// 'none'  = even the bottom of the range is over budget
function rangeFit(range, userMax) {
  if (!range) return 'none'
  if (range.min > userMax) return 'none'
  if (range.max <= userMax) return 'full'
  return 'partial'
}

function budgetAssessment(answers, n) {
  const budget = answers.budget
  // No budget answer: do not filter anyone out, and award nothing.
  if (!budget) return { fit: 'unknown', points: 0, reason: null, caveats: [] }
  const userMax = budget.max === null || budget.max === undefined ? Infinity : budget.max
  const caveats = []

  if (answers.tenure === 'buy') {
    const chosen = (answers.property_types || []).filter(t => t !== 'not_sure')
    const types = chosen.length ? chosen : ALL_SALE_TYPES
    let best = null
    for (const type of types) {
      const range = n.sale_ranges?.[type]
      if (!range) continue // type is rare here; skip rather than guess
      const fit = rangeFit(range, userMax)
      if (fit === 'none') continue
      if (!best || (fit === 'full' && best.fit === 'partial')) best = { type, range, fit }
    }
    if (!best) return { fit: 'none', points: 0, reason: null, caveats }

    const label = PROPERTY_LABEL[best.type]
    const reason = best.fit === 'full'
      ? `${label} here typically run ${price(best.range.min)}–${price(best.range.max)}, within your budget.`
      : `${label} here run ${price(best.range.min)}–${price(best.range.max)} — the lower end fits your budget.`
    if (best.fit === 'partial') caveats.push('Stretches your budget.')
    return {
      fit: best.fit,
      points: best.fit === 'full' ? W.BUDGET_FULL : W.BUDGET_PARTIAL,
      reason,
      caveats,
    }
  }

  // Renting
  const sizeKey = SIZE_KEY[answers.size] || 'one_bed'
  const range = n.rent_ranges?.[sizeKey]
  const fit = rangeFit(range, userMax)
  if (fit === 'none') return { fit: 'none', points: 0, reason: null, caveats }

  if (answers.size === 'three_plus') {
    caveats.push('3+ bedroom pricing is not in our data yet — these figures are for two-bedrooms.')
  }
  const label = SIZE_LABEL[answers.size] || 'Homes'
  const reason = fit === 'full'
    ? `${label} typically run ${money(range.min)}–${money(range.max)} here, within your budget.`
    : `${label} here run ${money(range.min)}–${money(range.max)} — the lower end fits your budget.`
  if (fit === 'partial') caveats.push('Stretches your budget.')
  return {
    fit,
    points: fit === 'full' ? W.BUDGET_FULL : W.BUDGET_PARTIAL,
    reason,
    caveats,
  }
}

function scoreOne(answers, n) {
  const budget = budgetAssessment(answers, n)
  if (budget.fit === 'none') return null // hard filter: never show an unaffordable match

  let score = budget.points
  const caveats = [...budget.caveats]
  // Reasons carry a rank so the most important four survive the cap.
  const reasons = []
  if (budget.reason) reasons.push({ rank: 1, text: budget.reason })

  // --- Commute. Only Midtown and FiDi exist in the dataset; anything else is
  // left unscored rather than guessed at.
  const dest = answers.commute_to
  const limitId = answers.commute_max
  if ((dest === 'midtown' || dest === 'downtown_fidi') && limitId && limitId !== 'no_preference') {
    const limit = limitId === '60_plus' ? 60 : parseInt(limitId, 10)
    const mins = n.commute_minutes?.[dest]
    if (Number.isFinite(mins) && Number.isFinite(limit)) {
      if (mins <= limit) {
        score += W.COMMUTE_WITHIN
        reasons.push({
          rank: 2,
          text: `About ${mins} minutes to ${DESTINATION_LABEL[dest]} by subway, inside your ${limit}-minute limit.`,
        })
      } else {
        score -= W.COMMUTE_OVER
        caveats.push(`About ${mins} minutes to ${DESTINATION_LABEL[dest]}, longer than your ${limit}-minute limit.`)
      }
    }
  }

  // --- Priorities
  const prefs = answers.priorities || {}
  let weighted = 0
  let weightedMax = 0
  const strongMatches = []
  for (const dim of DIMENSIONS) {
    const weight = PRIORITY_WEIGHT[prefs[dim]] ?? 0
    const value = n.scores?.[dim] ?? 0
    weighted += weight * value
    weightedMax += weight * 5
    if (prefs[dim] === 'must_have') {
      if (value >= 4) strongMatches.push({ dim, value })
      if (value <= 2) {
        caveats.push(`You marked ${DIMENSION_LABEL[dim]} as a must-have, but it rates ${value} of 5 here.`)
      }
    }
  }
  if (weightedMax > 0) score += (weighted / weightedMax) * W.PRIORITIES

  strongMatches.sort((a, b) => b.value - a.value || a.dim.localeCompare(b.dim))
  for (const { dim, value } of strongMatches) {
    const text = dim === 'transit_access'
      ? `You marked subway access as a must-have; ${n.subway_lines.length} subway lines serve the area.`
      : `You marked ${DIMENSION_LABEL[dim]} as a must-have, and ${n.name} rates ${value} of 5 for it.`
    reasons.push({ rank: 3, text })
  }

  // --- Pace
  const wantedPace = PACE_VALUE[answers.pace]
  if (wantedPace) {
    const distance = Math.abs(wantedPace - (n.scores?.pace ?? 3))
    score += (4 - distance) * W.PACE_STEP
    if (distance <= 1) {
      reasons.push({
        rank: 4,
        text: `You wanted ${PACE_WANTED[wantedPace]}, and ${n.name} is ${PACE_IS[n.scores.pace]}.`,
      })
    }
  }

  // --- Car. "No car" ignores this entirely, as specified.
  if (answers.car === 'yes_parking' || answers.car === 'maybe') {
    const normalized = ((n.car_friendly ?? 3) - 1) / 4 // 0..1
    score += normalized * (answers.car === 'yes_parking' ? W.CAR : W.CAR / 2)
    if (answers.car === 'yes_parking') {
      if (n.car_friendly >= 4) {
        reasons.push({
          rank: 5,
          text: `You need parking or easy street access, and ${n.name} rates ${n.car_friendly} of 5 for car ownership.`,
        })
      } else if (n.car_friendly <= 2) {
        caveats.push(`Parking is hard here — ${n.car_friendly} of 5 for car ownership.`)
      }
    }
  }

  // --- Home style
  const styles = (answers.home_style || []).filter(s => s !== 'no_preference')
  const matchedStyles = styles.filter(s => (n.housing_stock || []).includes(s))
  if (matchedStyles.length) {
    score += Math.min(matchedStyles.length * W.STYLE_EACH, W.STYLE_MAX)
    const list = joinWords(matchedStyles.map(s => STYLE_LABEL[s]))
    reasons.push({ rank: 6, text: `You like ${list}, which is a large part of the housing stock here.` })
  }

  // Move timeline deliberately has no scoring effect.

  reasons.sort((a, b) => a.rank - b.rank)
  return {
    neighborhood: n,
    score: Math.round(score * 10) / 10,
    reasons: reasons.slice(0, 4).map(r => r.text),
    caveats,
  }
}

// Ranked best-first. Ties break on id so the order is stable across runs.
export function matchNeighborhoods(answers = {}, neighborhoods = []) {
  const scored = []
  for (const n of neighborhoods) {
    const result = scoreOne(answers, n)
    if (result) scored.push(result)
  }
  scored.sort((a, b) => b.score - a.score || a.neighborhood.id.localeCompare(b.neighborhood.id))
  return scored
}

// The rent or sale range the user actually asked about, for display on a card.
export function askedPriceRange(answers, n) {
  if (answers.tenure === 'buy') {
    const chosen = (answers.property_types || []).filter(t => t !== 'not_sure')
    const types = chosen.length ? chosen : ALL_SALE_TYPES
    for (const type of types) {
      const range = n.sale_ranges?.[type]
      if (range) {
        return { label: PROPERTY_LABEL[type], text: `${price(range.min)}–${price(range.max)}` }
      }
    }
    return null
  }
  const sizeKey = SIZE_KEY[answers.size] || 'one_bed'
  const range = n.rent_ranges?.[sizeKey]
  if (!range) return null
  return {
    label: SIZE_LABEL[answers.size] || 'Homes',
    text: `${money(range.min)}–${money(range.max)}/mo`,
  }
}

export const __testing = { rangeFit, price, money }
