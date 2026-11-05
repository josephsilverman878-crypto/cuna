import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { demandBuckets, bedsLabel } from '../lib/demand'

// /demand: what renters are looking for, as counts of saved searches by
// neighborhood, bedrooms and price band. The database returns only buckets
// with 3 or more searches and nothing about who is searching. Verified
// posters only.
export default function Demand() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(undefined)

  useEffect(() => {
    if (!profile?.verified) { setData(null); return }
    demandBuckets().then(({ data: d, error }) => {
      if (error) { console.error('demand_buckets failed:', error); setData(null); return }
      setData(d?.error ? null : d)
    })
  }, [profile?.verified])

  const Bar = ({ label, sub, count, max }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '4px 10px', alignItems: 'center', padding: '6px 0' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: 'var(--warm-gray)' }}>{sub}</div>}
        <div style={{ height: '6px', background: 'var(--sand-dark)', borderRadius: '3px', marginTop: '4px' }}>
          <div style={{ width: `${Math.max(4, Math.round((count / max) * 100))}%`, height: '100%', background: 'var(--terracotta)', borderRadius: '3px' }} />
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'var(--terracotta)' }}>{count}</div>
    </div>
  )

  const Section = ({ title, rows, labelOf, subOf }) => {
    const max = Math.max(1, ...rows.map(r => r.count))
    return (
      <div className="card" style={{ padding: '18px 20px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 6px' }}>{title}</h2>
        {rows.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>No bucket has reached 3 saved searches yet.</p>
        ) : rows.map((r, i) => <Bar key={i} label={labelOf(r)} sub={subOf?.(r)} count={r.count} max={max} />)}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '100px' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)', padding: '16px 24px',
        position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex' }}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="var(--terracotta)" /> Demand
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>What renters and buyers are saving searches for</div>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data === undefined ? (
          <div className="center" style={{ padding: '40px' }}><div className="spinner" /></div>
        ) : data === null ? (
          <div className="card" style={{ padding: '22px', textAlign: 'center', color: 'var(--warm-gray)' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔒</div>
            <p style={{ fontSize: '14px', margin: 0 }}>{profile?.verified ? 'Could not load demand right now.' : 'Demand is available to verified posters.'}</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '13px', color: 'var(--warm-gray)', lineHeight: 1.5, margin: 0 }}>
              {data.total_saved_searches} saved search{data.total_saved_searches === 1 ? '' : 'es'} on Cuna. A bucket is shown only once 3 or more searches fall in it, and nothing here says who is searching.
            </p>
            <Section title="Neighborhoods" rows={data.neighborhoods || []} labelOf={r => r.name} subOf={r => r.borough} />
            <Section title="Bedrooms" rows={data.bedrooms || []} labelOf={r => bedsLabel(r.beds_min)} />
            <Section title="Budget" rows={data.price_bands || []} labelOf={r => r.band} subOf={r => (r.listing_type === 'sale' ? 'Buying' : 'Renting')} />
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
