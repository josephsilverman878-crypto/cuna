import { useEffect, useState } from 'react'
import { listingViewsDaily } from '../lib/stats'

// Per-listing statistics for the dashboard: totals from listing_stats() and
// a 30-day bar of daily views from listing_views_daily(). Counts only; the
// database stores no user id with a view and returns none here.
export default function ListingStats({ listingId, stats }) {
  const [daily, setDaily] = useState(null)

  useEffect(() => {
    let cancelled = false
    listingViewsDaily(listingId, 30).then(({ data, error }) => {
      if (cancelled) return
      if (error) console.error('Daily views failed:', error)
      setDaily(data || [])
    })
    return () => { cancelled = true }
  }, [listingId])

  const days = []
  const byDay = {}
  ;(daily || []).forEach(d => { byDay[d.day] = d.views })
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    days.push({ key, views: byDay[key] || 0 })
  }
  const max = Math.max(1, ...days.map(d => d.views))
  const total30 = days.reduce((s, d) => s + d.views, 0)

  const cell = (label, value) => (
    <div style={{ textAlign: 'center', flex: 1, minWidth: '70px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, color: 'var(--terracotta)', lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '10px', color: 'var(--warm-gray)', marginTop: '4px' }}>{label}</div>
    </div>
  )

  return (
    <div style={{ background: 'var(--sand)', borderRadius: '12px', padding: '12px 14px', marginTop: '10px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {cell('Views, 7 days', stats?.views_7d)}
        {cell('Views, 30 days', stats?.views_30d)}
        {cell('All views', stats?.views_total)}
        {cell('Saves', stats?.saves)}
        {cell('Leads', stats?.inquiries)}
        {cell('New leads', stats?.inquiries_new)}
      </div>
      {daily === null ? (
        <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>Loading daily views…</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '56px' }} aria-label="Daily views, last 30 days">
            {days.map(d => (
              <div key={d.key} title={`${d.key}: ${d.views} view${d.views === 1 ? '' : 's'}`} style={{
                flex: 1, background: d.views ? 'var(--terracotta)' : 'var(--sand-dark)',
                height: `${Math.max(3, Math.round((d.views / max) * 56))}px`, borderRadius: '2px 2px 0 0',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--warm-gray)', marginTop: '4px' }}>
            <span>30 days ago</span>
            <span>{total30} view{total30 === 1 ? '' : 's'} in 30 days · one per visitor per day</span>
            <span>Today</span>
          </div>
        </>
      )}
    </div>
  )
}
