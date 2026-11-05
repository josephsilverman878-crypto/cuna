import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ShieldCheck, Building2, BadgeCheck, BedDouble, Bath } from 'lucide-react'
import { getAgentPublic, LICENSE_TYPE_LABELS } from '../lib/agents'
import { priceText } from '../lib/listingTypes'
import { statusLabel } from '../lib/listingStatus'

// /agent/:id — a verified poster's public page: photo, bio, brokerage,
// license, and their active and past Cuna listings. Works signed out.
// agent_public() returns null for anyone who is not a verified poster.
export default function AgentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [agent, setAgent] = useState(undefined)

  useEffect(() => {
    let cancelled = false
    setAgent(undefined)
    getAgentPublic(id).then(({ data, error }) => {
      if (cancelled) return
      if (error) console.error('agent_public failed:', error)
      setAgent(data || null)
    })
    return () => { cancelled = true }
  }, [id])

  if (agent === undefined) return <div className="center" style={{ height: '100dvh' }}><div className="spinner" /></div>

  if (agent === null) {
    return (
      <div className="center" style={{ height: '100dvh', flexDirection: 'column', gap: '12px', padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--warm-gray)' }}>This agent page is not available.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Go home</button>
      </div>
    )
  }

  const initials = (agent.name || '?').split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
  const since = agent.member_since ? new Date(agent.member_since).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : null

  const ListingRow = ({ l, past }) => (
    <button type="button" onClick={() => navigate('/listing/' + l.id)} className="card" style={{
      padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', textAlign: 'left', cursor: 'pointer', border: 'none', width: '100%',
    }}>
      <div style={{ width: '72px', height: '56px', borderRadius: '10px', background: 'var(--sand-dark)', flexShrink: 0, overflow: 'hidden' }}>
        {l.photo && <img src={l.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.address}</div>
        <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>{l.neighborhood ? `${l.neighborhood}, ` : ''}{l.city}</div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px', fontSize: '12px', color: 'var(--charcoal-soft)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, color: past ? 'var(--warm-gray)' : 'var(--terracotta)' }}>{priceText(l)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><BedDouble size={12} /> {l.bedrooms}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Bath size={12} /> {l.bathrooms}</span>
          {past && <span className="tag" style={{ fontSize: '10px' }}>{statusLabel(l.status)}</span>}
        </div>
      </div>
    </button>
  )

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
        <div className="card" style={{ padding: '22px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            background: 'var(--terracotta)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 600,
          }}>
            {agent.avatar_url ? <img src={agent.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 600, margin: 0, lineHeight: 1.1 }}>{agent.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'var(--like-green)', marginTop: '6px' }}>
              <BadgeCheck size={14} /> Verified by Cuna
            </div>
            {agent.brokerage_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--charcoal-soft)', marginTop: '8px' }}>
                <Building2 size={14} /> {agent.brokerage_name}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--charcoal-soft)', marginTop: '4px' }}>
              <ShieldCheck size={14} />
              {LICENSE_TYPE_LABELS[agent.license_type] || 'Licensed'}
              {agent.license_type !== 'owner' && agent.license_number ? ` · NY DOS #${agent.license_number}` : ''}
            </div>
            {since && <div style={{ fontSize: '12px', color: 'var(--warm-gray)', marginTop: '6px' }}>On Cuna since {since}</div>}
          </div>
        </div>

        {agent.bio && (
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 8px' }}>About</h2>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--charcoal-soft)', margin: 0, whiteSpace: 'pre-line' }}>{agent.bio}</p>
          </div>
        )}

        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 10px' }}>
            Current listings ({agent.active_listings?.length || 0})
          </h2>
          {(agent.active_listings || []).length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--warm-gray)' }}>No active listings right now.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {agent.active_listings.map(l => <ListingRow key={l.id} l={l} />)}
            </div>
          )}
        </div>

        {(agent.past_listings || []).length > 0 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 10px' }}>Past listings on Cuna</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {agent.past_listings.map(l => <ListingRow key={l.id} l={l} past />)}
            </div>
          </div>
        )}

        <p style={{ fontSize: '11px', color: 'var(--warm-gray)', lineHeight: 1.5, textAlign: 'center' }}>
          Cuna checks license details against the New York Department of State before verifying an agent. Every listing on Cuna follows fair housing law.
        </p>
      </div>
    </div>
  )
}
