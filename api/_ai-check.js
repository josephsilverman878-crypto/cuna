// Shared grounding check: a number in the assistant's words must be a
// number the facts hold. Whole numbers are compared (so "12" in the answer
// is not excused by "2026-12-01" unless 12 itself is a fact), commas and
// leading zeros ignored.
export function numberTokens(text) {
  const set = new Set()
  for (const m of String(text || '').matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
    const n = Number(m[0].replace(/,/g, '').replace(/\.$/, ''))
    if (Number.isFinite(n)) set.add(String(n))
  }
  return set
}

// Returns the first number in `answer` that the facts do not hold, as it
// was written, or null.
export function ungroundedNumber(answer, factsText) {
  const known = numberTokens(factsText)
  for (const m of String(answer || '').matchAll(/\$?\d[\d,]*(?:\.\d+)?/g)) {
    const n = Number(m[0].replace(/[$,]/g, '').replace(/\.$/, ''))
    if (Number.isFinite(n) && !known.has(String(n))) return m[0]
  }
  return null
}
