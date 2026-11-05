import { PROPERTY_TYPES } from '../lib/listingTypes'

// The sale-only fields of the Post / Edit forms (Costs tab). `form` holds
// strings; the page converts on submit. Co-ops carry maintenance, condos and
// houses carry common charges and taxes; all are optional except the type.
export default function SaleFinancialsFields({ form, update, inputStyle, rowStyle, showType = true }) {
  const isCoop = form.property_type === 'coop'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ background: 'rgba(76,175,125,0.06)', border: '1px solid rgba(76,175,125,0.25)' }}>
        <p style={{ fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
          <strong>Sales listings are free to post.</strong> Enter the monthly charges a buyer will owe
          the building and the city; buyers see them next to the asking price.
        </p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', margin: 0 }}>Sale details</h3>
        {showType && (
          <div>
            <label className="label">Property type *</label>
            <select value={form.property_type} onChange={e => update('property_type', e.target.value)} style={inputStyle}>
              <option value="">Select…</option>
              {PROPERTY_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        )}
        {isCoop ? (
          <div>
            <label className="label">Maintenance ($ per month)</label>
            <input type="number" min="0" placeholder="1200" value={form.maintenance}
              onChange={e => update('maintenance', e.target.value)} style={inputStyle} />
            <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: '6px 0 0' }}>Co-op maintenance usually includes the building's taxes.</p>
          </div>
        ) : (
          <div style={rowStyle}>
            <div>
              <label className="label">Common charges ($ per month)</label>
              <input type="number" min="0" placeholder="900" value={form.common_charges}
                onChange={e => update('common_charges', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="label">Taxes ($ per month)</label>
              <input type="number" min="0" placeholder="600" value={form.monthly_taxes}
                onChange={e => update('monthly_taxes', e.target.value)} style={inputStyle} />
            </div>
          </div>
        )}
        <div style={rowStyle}>
          <div>
            <label className="label">Tax deductible (%)</label>
            <input type="number" min="0" max="100" placeholder="40" value={form.tax_deductible_pct}
              onChange={e => update('tax_deductible_pct', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="label">Financing allowed (%)</label>
            <input type="number" min="0" max="100" placeholder="80" value={form.financing_allowed_pct}
              onChange={e => update('financing_allowed_pct', e.target.value)} style={inputStyle} />
          </div>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: 0, lineHeight: 1.55 }}>
          Leave a field blank if it does not apply. No broker fee or application fee is collected through Cuna.
        </p>
      </div>
    </div>
  )
}

// Converts the sale fields of a form into listing columns (null when blank).
export function saleColumns(form) {
  const n = v => (v === '' || v === null || v === undefined ? null : Number(v))
  const sale = form.listing_type === 'sale'
  return {
    listing_type: sale ? 'sale' : 'rent',
    property_type: sale ? (form.property_type || null) : null,
    common_charges: sale && form.property_type !== 'coop' ? n(form.common_charges) : null,
    maintenance: sale && form.property_type === 'coop' ? n(form.maintenance) : null,
    monthly_taxes: sale && form.property_type !== 'coop' ? n(form.monthly_taxes) : null,
    tax_deductible_pct: sale ? n(form.tax_deductible_pct) : null,
    financing_allowed_pct: sale ? n(form.financing_allowed_pct) : null,
  }
}
