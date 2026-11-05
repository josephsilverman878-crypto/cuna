import { propertyTypeLabel, money, monthlyCarrying } from '../lib/listingTypes'

// The sale financials block on a sale listing's page.
export default function SaleDetails({ listing }) {
  if (listing?.listing_type !== 'sale') return null
  const rows = [
    ['Property type', propertyTypeLabel(listing.property_type) || '—'],
    listing.maintenance != null ? ['Maintenance (monthly)', money(listing.maintenance)] : null,
    listing.common_charges != null ? ['Common charges (monthly)', money(listing.common_charges)] : null,
    listing.monthly_taxes != null ? ['Taxes (monthly)', money(listing.monthly_taxes)] : null,
    listing.tax_deductible_pct != null ? ['Tax deductible', `${Number(listing.tax_deductible_pct)}%`] : null,
    listing.financing_allowed_pct != null ? ['Financing allowed', `${Number(listing.financing_allowed_pct)}%`] : null,
  ].filter(Boolean)
  const carrying = monthlyCarrying(listing)
  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>Sale details</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: 'var(--warm-gray)' }}>{label}</span>
            <span style={{ fontWeight: 500 }}>{value}</span>
          </div>
        ))}
        {carrying != null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', paddingTop: '10px', borderTop: '1px solid var(--sand-dark)', fontWeight: 700 }}>
            <span>Monthly charges and taxes</span>
            <span style={{ color: 'var(--terracotta)' }}>{money(carrying)}</span>
          </div>
        )}
      </div>
      <p style={{ fontSize: '11px', color: 'var(--warm-gray)', margin: '8px 0 0', lineHeight: 1.5 }}>
        Figures as entered by the poster. Mortgage costs are not included.
      </p>
    </div>
  )
}
