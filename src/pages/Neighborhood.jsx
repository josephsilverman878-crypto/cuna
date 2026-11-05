import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeft, TrainFront, School, HeartPulse, BedDouble, Bath } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { listNeighborhoods } from '../lib/areas'
import { fetchSchoolsIn, fetchHospitalsIn, fetchStationsIn, fetchListingsIn, listingSummary, dofRowsFor, GROUP_LABELS, MIN_RECORDS, BOROUGH_DIGIT } from '../lib/neighborhoodPage'
import { fetchDofMarket } from '../lib/market'
import { priceText, money } from '../lib/listingTypes'
import { ROUTE_COLORS } from '../lib/subway'

// /neighborhoods/:slug — the live version of the pre-rendered neighborhood
// page. Same data module as the build script (src/lib/neighborhoodPage.js).
export default function Neighborhood() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [hood, setHood] = useState(undefined)
  const [shape, setShape] = useState(null)
  const [stations, setStations] = useState(null)
  const [schools, setSchools] = useState(null)
  const [hospitals, setHospitals] = useState(null)
  const [listings, setListings] = useState(null)
  const [dof, setDof] = useState(null)

  useEffect(() => {
    let cancelled = false
    setHood(undefined); setShape(null); setStations(null); setSchools(null); setHospitals(null); setListings(null); setDof(null)
    listNeighborhoods().then(async all => {
      const h = all.find(n => n.slug === slug)
      if (cancelled) return
      if (!h) { setHood(null); return }
      setHood(h)
      document.title = `${h.name}, ${h.borough} | Cuna`
      fetchListingsIn(supabase, h.id).then(l => !cancelled && setListings(l)).catch(e => { console.error(e); setListings([]) })
      fetchDofMarket(BOROUGH_DIGIT[h.borough]).then(m => !cancelled && setDof(dofRowsFor(h.name, m.rows || []))).catch(e => { console.error(e); setDof([]) })
      const { data: geo, error } = await supabase.rpc('neighborhood_shape', { p_id: h.id })
      if (cancelled) return
      if (error || !geo) { console.error('neighborhood_shape failed:', error); setStations([]); setSchools([]); setHospitals([]); return }
      const geometry = geo.type === 'Feature' ? geo.geometry : geo
      setShape(geometry)
      fetchStationsIn(supabase, geometry).then(s => !cancelled && setStations(s)).catch(e => { console.error(e); setStations([]) })
      fetchSchoolsIn(geometry).then(s => !cancelled && setSchools(s)).catch(e => { console.error(e); setSchools([]) })
      fetchHospitalsIn(geometry).then(s => !cancelled && setHospitals(s)).catch(e => { console.error(e); setHospitals([]) })
    }).catch(e => { console.error(e); setHood(null) })
    return () => { cancelled = true }
  }, [slug])

  if (hood === undefined) return <div className="center" style={{ height: '100dvh' }}><div className="spinner" /></div>
  if (hood === null) {
    return (
      <div className="center" style={{ height: '100dvh', flexDirection: 'column', gap: '12px' }}>
        <p style={{ color: 'var(--warm-gray)' }}>No neighborhood page for “{slug}”.</p>
        <Link to="/neighborhoods" className="btn-primary" style={{ textDecoration: 'none' }}>All neighborhoods</Link>
      </div>
    )
  }

  const summary = listingSummary(listings || [])
  const Section = ({ icon: Icon, title, children, source }) => (
    <section className="card" style={{ padding: '18px 20px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {Icon && <Icon size={18} color="var(--terracotta)" />} {title}
      </h2>
      {children}
      {source && <div style={{ fontSize: '11px', color: 'var(--warm-gray)', marginTop: '10px' }}>Source: {source}</div>}
    </section>
  )
  const Loading = () => <div style={{ fontSize: '13px', color: 'var(--warm-gray)' }}>Loading…</div>

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '60px' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)', padding: '16px 24px',
        position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <button onClick={() => navigate('/neighborhoods')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex' }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, color: 'var(--terracotta)' }}>cuna</div>
      </div>

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>{hood.borough}{hood.area_km2 ? ` · ${Number(hood.area_km2).toFixed(1)} km²` : ''}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '34px', fontWeight: 600, margin: '2px 0 0', lineHeight: 1.05 }}>{hood.name}</h1>
          <p style={{ fontSize: '14px', color: 'var(--charcoal-soft)', lineHeight: 1.6, margin: '10px 0 0' }}>
            Homes on Cuna, how to get around, nearby public schools and hospitals, and what has sold, all from public records and Cuna’s own listings.
          </p>
        </div>

        <Section title={`On Cuna now${listings ? ` (${summary.count})` : ''}`} source="Cuna listings marked Active or In contract, read live.">
          {listings === null ? <Loading /> : listings.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>Nothing in {hood.name} is listed on Cuna right now. <Link to="/feed" style={{ color: 'var(--terracotta)' }}>Save a search</Link> and you will hear first.</p>
          ) : (
            <>
              {(summary.rent_median || summary.sale_median) && (
                <p style={{ fontSize: '13px', color: 'var(--charcoal-soft)', margin: '0 0 10px' }}>
                  {summary.rent_median ? `Median asking rent ${money(summary.rent_median)}/mo (${summary.rent} rentals). ` : ''}
                  {summary.sale_median ? `Median asking price ${money(summary.sale_median)} (${summary.sale} for sale).` : ''}
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                {listings.slice(0, 12).map(l => (
                  <Link key={l.id} to={'/listing/' + l.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ height: '96px', borderRadius: '10px', background: 'var(--sand-dark)', overflow: 'hidden' }}>
                      {l.photos?.[0] && <img src={l.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 600, color: 'var(--terracotta)', marginTop: '6px' }}>{priceText(l)}</div>
                    <div style={{ fontSize: '12px', color: 'var(--charcoal-soft)', display: 'flex', gap: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><BedDouble size={11} /> {l.bedrooms}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Bath size={11} /> {l.bathrooms}</span>
                    </div>
                  </Link>
                ))}
              </div>
              {listings.length > 12 && <Link to="/feed" style={{ fontSize: '13px', color: 'var(--terracotta)', display: 'inline-block', marginTop: '10px' }}>See all {listings.length} in the feed</Link>}
            </>
          )}
        </Section>

        <Section icon={TrainFront} title="Subway" source="MTA subway stations (NYC Open Data 39hk-dx4f), stations inside the neighborhood boundary.">
          {stations === null ? <Loading /> : stations.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>No subway station inside {hood.name}; the nearest ones show on each listing page.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stations.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {s.routes.map(r => (
                      <span key={r} style={{ width: '20px', height: '20px', borderRadius: '50%', background: ROUTE_COLORS?.[r] || 'var(--charcoal)', color: 'white', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{r}</span>
                    ))}
                  </div>
                  <span>{s.name}</span>
                  {s.ada && <span className="tag" style={{ fontSize: '10px' }}>Accessible</span>}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section icon={School} title="Public schools" source="NYC Department of Education school locations (NYC Open Data wg9x-4ke6). Names, grades and addresses only.">
          {schools === null ? <Loading /> : schools.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>No public school building inside this boundary.</p>
          ) : (
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: '14px', lineHeight: 1.7 }}>
              {schools.map(s => <li key={s.name + s.address}>{s.name}{s.grades ? <span style={{ color: 'var(--warm-gray)' }}> · grades {s.grades}</span> : null}{s.address ? <span style={{ color: 'var(--warm-gray)' }}> · {s.address}</span> : null}</li>)}
            </ul>
          )}
        </Section>

        <Section icon={HeartPulse} title="Hospitals" source="New York State Department of Health facility list (health.data.ny.gov vn5v-hh5r), hospitals inside the boundary.">
          {hospitals === null ? <Loading /> : hospitals.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>No hospital inside this boundary.</p>
          ) : (
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: '14px', lineHeight: 1.7 }}>
              {hospitals.map(h => <li key={h.name}>{h.name}{h.address ? <span style={{ color: 'var(--warm-gray)' }}> · {h.address}</span> : null}</li>)}
            </ul>
          )}
        </Section>

        <Section title="Recorded sales, last 12 months" source="NYC Department of Finance Rolling Sales (NYC Open Data usep-8jbt), by the Department’s own neighborhood names; shown with 10 or more sales.">
          {dof === null ? <Loading /> : dof.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--warm-gray)', margin: 0 }}>Fewer than {MIN_RECORDS} recorded sales matched this neighborhood’s name. See the <Link to="/market" style={{ color: 'var(--terracotta)' }}>Market page</Link> for the borough.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {dof.map(r => (
                  <tr key={r.neighborhood + r.group} style={{ borderTop: '1px solid var(--sand-dark)' }}>
                    <td style={{ padding: '8px 6px' }}>{GROUP_LABELS[r.group]}<div style={{ fontSize: '10px', color: 'var(--warm-gray)' }}>{r.neighborhood}</div></td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}><strong>{money(r.median)}</strong><div style={{ fontSize: '10px', color: 'var(--warm-gray)' }}>{r.n} sales · to {r.latest}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <p style={{ fontSize: '11px', color: 'var(--warm-gray)', lineHeight: 1.6, textAlign: 'center' }}>
          Cuna describes neighborhoods by what is there, never by who lives there. Every home on Cuna is offered in line with federal, New York State and New York City fair housing law.
        </p>
      </main>
    </div>
  )
}
