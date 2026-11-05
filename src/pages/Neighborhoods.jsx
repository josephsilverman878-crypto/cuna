import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Search } from 'lucide-react'
import { listNeighborhoods, groupByBorough } from '../lib/areas'

// /neighborhoods — every neighborhood page, by borough.
export default function Neighborhoods() {
  const navigate = useNavigate()
  const [all, setAll] = useState(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    document.title = 'New York City neighborhoods | Cuna'
    listNeighborhoods().then(setAll).catch(err => { console.error(err); setAll([]) })
  }, [])

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return groupByBorough((all || []).filter(n => !needle || n.name.toLowerCase().includes(needle)))
  }, [all, q])

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '60px' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)', padding: '16px 24px',
        position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex' }}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, margin: 0 }}>Neighborhoods</h1>
          <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>Every New York City neighborhood on Cuna</div>
        </div>
      </div>
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} color="var(--warm-gray)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find a neighborhood" style={{ paddingLeft: '36px', fontSize: '14px' }} />
        </div>
        {all === null ? (
          <div className="center" style={{ padding: '40px' }}><div className="spinner" /></div>
        ) : groups.map(([borough, items]) => (
          <section key={borough}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', margin: '0 0 8px' }}>{borough}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {items.map(n => (
                <Link key={n.id} to={'/neighborhoods/' + n.slug} style={{
                  padding: '7px 12px', borderRadius: '20px', fontSize: '13px', textDecoration: 'none',
                  background: 'var(--white)', color: 'var(--charcoal)', border: '1px solid var(--sand-dark)',
                }}>{n.name}</Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
