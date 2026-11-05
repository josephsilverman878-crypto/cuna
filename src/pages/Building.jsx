import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Building2, BedDouble, Bath, Maximize2 } from 'lucide-react'
import { buildingFacts, buildingListings, isValidBbl } from '../lib/building'
import { priceText, isSale } from '../lib/listingTypes'
import { statusLabel } from '../lib/listingStatus'
import RecordedSales from '../components/RecordedSales'
import PastListings from '../components/PastListings'

// /building/:bbl — one tax lot: facts from PLUTO, every Cuna listing in it
// (live and past) and the recorded sales. Public, works signed out.
export default function Building() {
  const { bbl } = useParams()
  const navigate = useNavigate()
  const [facts, setFacts] = useState(undefined)
  const [listings, setListings] = useState([])

  useEffect(() => {
    let cancelled = false
    setFacts(undefined)
    if (!isValidBbl(bbl)) { setFacts(null); return }
    buildingFacts(bbl).then(f => { if (!cancelled) setFacts(f) }).catch(err => { console.error('PLUTO failed:', err); if (!cancelled) setFacts(null) })
    buildingListings(bbl).then(({ data, error }) => {
      if (cancelled) return
      if (error) console.error('Building listings failed:', error)
      setListings(data || [])
    })
    return () => { cancelled = true }
  }, [bbl])

  if (facts === undefined) return <div className="center" style={{ height: '100dvh' }}><div className="spinner" /></div>

  const Fact = ({ label, value }) => value ? (
    <div style={{ flex: '1 1 110px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, color: 'var(--terracotta)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--warm-gray)', marginTop: '3px' }}>{label}</div>
    </div>
  ) : null

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '40px' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)', padding: '16px 24px',
        position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex' }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, color: 'var(--terracotta)' }}>cuna</div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {facts === null ? (
          <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--warm-gray)' }}>
            <Building2 size={32} color="var(--warm-gray-light)" />
            <p style={{ margin: '10px 0 0', fontSize: '14px' }}>No building record for this tax lot{isValidBbl(bbl) ? ` (BBL ${bbl})` : ''}.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ fontSize: '12px', color: 'var(--warm-gray)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={14} /> Building · {facts.borough}{facts.zip ? ` ${facts.zip}` : ''}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 600, margin: '6px 0 4px', lineHeight: 1.1 }}>{facts.address}</h1>
            {facts.class_label && <div style={{ fontSize: '14px', color: 'var(--charcoal-soft)' }}>{facts.class_label}</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '16px' }}>
              <Fact label="Built" value={facts.year_built} />
              <Fact label="Apartments" value={facts.units_res} />
              <Fact label="Floors" value={facts.floors} />
              {facts.units_total && facts.units_total !== facts.units_res ? <Fact label="Units in all" value={facts.units_total} /> : null}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--warm-gray)', marginTop: '14px' }}>
              Source: NYC Department of City Planning PLUTO (tax lot {facts.bbl}), read live from NYC Open Data.
            </div>
          </div>
        )}

        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 10px' }}>On Cuna now ({listings.length})</h2>
          {listings.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>Nothing in this building is listed on Cuna right now.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {listings.map(l => (
                <button key={l.id} type="button" onClick={() => navigate('/listing/' + l.id)} className="card" style={{
                  padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', textAlign: 'left', cursor: 'pointer', border: 'none', width: '100%',
                }}>
                  <div style={{ width: '72px', height: '56px', borderRadius: '10px', background: 'var(--sand-dark)', flexShrink: 0, overflow: 'hidden' }}>
                    {l.photos?.[0] && <img src={l.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.address}</div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px', fontSize: '12px', color: 'var(--charcoal-soft)', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, color: 'var(--terracotta)' }}>{priceText(l)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><BedDouble size={12} /> {l.bedrooms}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Bath size={12} /> {l.bathrooms}</span>
                      {l.sqft ? <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Maximize2 size={12} /> {l.sqft} ft²</span> : null}
                      <span className="tag" style={{ fontSize: '10px' }}>{isSale(l) ? 'For sale' : 'For rent'}{l.status !== 'active' ? ` · ${statusLabel(l.status)}` : ''}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <PastListings bbl={bbl} />
        <RecordedSales bbl={bbl} />

        <p style={{ fontSize: '11px', color: 'var(--warm-gray)', lineHeight: 1.5, textAlign: 'center' }}>
          Cuna shows public building facts and public sale records so you can judge a home by the building, never by who lives there.
        </p>
      </div>
    </div>
  )
}
