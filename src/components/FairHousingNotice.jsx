import { Shield } from 'lucide-react'

export default function FairHousingNotice({ compact = false }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      background: 'var(--white)',
      border: '1px solid var(--sand-dark)',
      borderRadius: 'var(--radius-sm)',
      padding: compact ? '10px 12px' : '14px 16px',
    }}>
      <Shield
        size={compact ? 15 : 17}
        strokeWidth={2}
        color="var(--terracotta)"
        style={{ flexShrink: 0, marginTop: '1px' }}
      />
      <p style={{
        margin: 0,
        fontSize: compact ? '11px' : '13px',
        lineHeight: 1.5,
        color: 'var(--charcoal)',
      }}>
        <strong>Fair Housing in NYC:</strong> It is illegal to discriminate in housing based on
        race, color, religion, national origin, sex, disability, familial status, age, lawful
        source of income (including vouchers), or other protected characteristics.{' '}
        <a
          href="https://www.nyc.gov/site/cchr/law/fair-housing.page"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--terracotta)', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          Know your rights
        </a>
      </p>
    </div>
  )
}
