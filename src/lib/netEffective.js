// Net effective rent: what a renter pays per month averaged over the lease
// once free months are spread out. The database keeps the same number in
// listings.net_effective_price (generated), so cards, the page, filters and
// sort all agree; these helpers only compute and label.

export function netEffective(price, monthsFree, leaseTermMonths) {
  const p = Number(price) || 0
  const free = Number(monthsFree) || 0
  const term = Number(leaseTermMonths) || 12
  if (!(term > free) || free <= 0) return p
  return Math.round(p * (term - free) / term)
}

export function hasConcession(listing) {
  return Number(listing?.months_free) > 0 && Number(listing?.net_effective_price ?? netEffective(listing?.price, listing?.months_free, listing?.lease_term_months)) < Number(listing?.price)
}

// "1 month free on a 13-month lease"
export function concessionText(listing) {
  if (!hasConcession(listing)) return ''
  const free = Number(listing.months_free)
  const term = Number(listing.lease_term_months) || 12
  const freeText = Number.isInteger(free) ? `${free} month${free === 1 ? '' : 's'}` : `${free} months`
  return `${freeText} free on a ${term}-month lease`
}

export const PRICE_BASIS = [
  { id: 'gross', label: 'Gross rent', short: 'Gross' },
  { id: 'net', label: 'Net effective rent', short: 'Net' },
]
