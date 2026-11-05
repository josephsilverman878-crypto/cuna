import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Search } from 'lucide-react'
import { fetchDofMarket, cunaListingMedians, prettyDofName, DOF_GROUP_LABELS, BOROUGH_NAMES, BOROUGH_DIGITS, MIN_RECORDS } from '../lib/market'
import { money } from '../lib/listingTypes'

// /market — medians and counts by neighborhood from two sources only: NYC
// Department of Finance recorded sales (last 12 months) and the listings
// on Cuna right now. Every figure says where it comes from and as of when;
// anything resting on fewer than 10 records is not shown at all.
export default function Market() {
  const navigate = useNavigate()
  const [borough, setBorough] = useState('3')
  const [q, setQ] = useState('')
  const [dof, setDof] = useState(undefined)
  const [cuna, setCuna] = useState(undefined)

  useEffect(() => {
    let cancelled = false
    setDof(undefined)
    fetchDofMarket(borough).then(d => { if (!cancelled) setDof(d) }).catch(err => { console.error(err); if (!cancelled) setDof(null) })
    return () => { cancelled = true }
  }, [borough])

  useEffect(() => {
    cunaListingMedians().then(setCuna).catch(err => { console.error(err); setCuna(null) })
  }, [])

  const table = useMemo(() => {
    if (!dof?.rows) return []
    const byHood = {}
    dof.rows.forEach(r => {
      const h = (byHood[r.neighborhood] ||= { neighborhood: r.neighborhood, borough: r.borough, houses: null, coops: null, condos: null })
      h[r.group] = { n: r.n, median: r.median }
    })
    const needle = q.trim().toLowerCase()
    return Object.values(byHood)
      .filter(h => !needle || h.neighborhood.toLowerCase().includes(needle))
      .sort((a, b) => a.neighborhood.localeCompare(b.neighborhood))
  }, [dof, q])

  const cunaRows = (cuna?.rows || []).filter(r => !q.trim() || r.neighborhood.toLowerCase().includes(q.trim().toLowerCase()))
    .filter(r => !borough || BOROUGH_DIGITS[r.borough] === borough || !BOROUGH_DIGITS[r.borough])

  const pill = (on) => ({
    padding: '7px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap',
    background: on ? 'var(--terracotta)' : 'var(--white)', color: on ? 'white' : 'var(--warm-gray)',
    border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
  })

  const Cell = ({ v }) => v ? (
    <td style={{ padding: '8px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}>
      <div style={{ fontWeight: 600 }}>{money(v.median)}</div>
      <div style={{ fontSize: '10px', color: 'var(--warm-gray)' }}>{v.n} sales</div>
    </td>
  ) : <td style={{ padding: '8px 6px', textAlign: 'right', color: 'var(--warm-gray-light)' }}>–</td>

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
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, margin: 0 }}>Market</h1>
          <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>Medians by neighborhood, from public records and Cuna</div>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {Object.entries(BOROUGH_NAMES).map(([d, name]) => (
            <button key={d} onClick={() => setBorough(d)} style={pill(borough === d)}>{name}</button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} color="var(--warm-gray)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find a neighborhood" style={{ paddingLeft: '36px', fontSize: '14px' }} />
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 4px' }}>Recorded sales, last 12 months</h2>
          <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: '0 0 12px', lineHeight: 1.5 }}>
            Median recorded sale price and the number of sales, by the Department of Finance’s own neighborhood names.
            {dof?.window ? ` Sales from ${dof.window.from} through ${dof.window.to || 'the latest filing'}.` : ''} A neighborhood is listed only with {MIN_RECORDS} or more sales in that column.
          </p>
          {dof === undefined ? (
            <div className="center" style={{ padding: '30px' }}><div className="spinner" /></div>
          ) : dof === null ? (
            <p style={{ fontSize: '13px', color: 'var(--pass-red)', margin: 0 }}>NYC Open Data did not answer. Try again in a minute.</p>
          ) : table.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>No neighborhood matches.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: 'var(--warm-gray)', fontSize: '11px', textAlign: 'right' }}>
                    <th style={{ textAlign: 'left', padding: '6px', fontWeight: 500 }}>Neighborhood</th>
                    {Object.values(DOF_GROUP_LABELS).map(l => <th key={l} style={{ padding: '6px', fontWeight: 500 }}>{l}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {table.map(h => (
                    <tr key={h.neighborhood} style={{ borderTop: '1px solid var(--sand-dark)' }}>
                      <td style={{ padding: '8px 6px', fontWeight: 500 }}>{prettyDofName(h.neighborhood)}</td>
                      <Cell v={h.houses} /><Cell v={h.coops} /><Cell v={h.condos} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ fontSize: '11px', color: 'var(--warm-gray)', marginTop: '12px', lineHeight: 1.5 }}>
            Source: {dof?.source || 'NYC Department of Finance Rolling Sales (NYC Open Data usep-8jbt)'}. Sales under $100,000 are left out as non-market transfers. Co-op sales reach this file only when they are recorded.
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 4px' }}>On Cuna right now</h2>
          <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: '0 0 12px', lineHeight: 1.5 }}>
            Median asking price of live Cuna listings by neighborhood{cuna?.asOf ? `, as of ${cuna.asOf}` : ''}. Shown once a neighborhood has {MIN_RECORDS} or more live listings of a kind.
          </p>
          {cuna === undefined ? (
            <div className="center" style={{ padding: '20px' }}><div className="spinner" /></div>
          ) : cuna === null ? (
            <p style={{ fontSize: '13px', color: 'var(--pass-red)', margin: 0 }}>Could not load Cuna listings.</p>
          ) : cunaRows.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>
              Not enough live listings yet for a median here ({cuna.total} live listing{cuna.total === 1 ? '' : 's'} on Cuna in all).
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {cunaRows.map(r => (
                  <tr key={`${r.neighborhood}|${r.listing_type}`} style={{ borderTop: '1px solid var(--sand-dark)' }}>
                    <td style={{ padding: '8px 6px', fontWeight: 500 }}>{r.neighborhood}<div style={{ fontSize: '10px', color: 'var(--warm-gray)' }}>{r.borough}</div></td>
                    <td style={{ padding: '8px 6px', color: 'var(--charcoal-soft)' }}>{r.listing_type === 'sale' ? 'For sale' : 'For rent'}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600 }}>{money(r.median)}{r.listing_type === 'sale' ? '' : '/mo'}</div>
                      <div style={{ fontSize: '10px', color: 'var(--warm-gray)' }}>{r.n} listings</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ fontSize: '11px', color: 'var(--warm-gray)', marginTop: '12px' }}>Source: Cuna listings marked Active, read live.</div>
        </div>
      </div>
    </div>
  )
}
