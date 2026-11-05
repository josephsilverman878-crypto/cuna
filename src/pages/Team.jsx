import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, UserPlus, Users, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { myTeam, createBrokerageFor, addMember, removeMember, teamListings } from '../lib/teams'
import { priceText } from '../lib/listingTypes'
import { statusesFor, statusLabel } from '../lib/listingStatus'

// /team: brokerage team accounts. A verified poster creates a brokerage and
// becomes its owner; the owner adds verified agents by email, sees every
// team listing and can change its status or edit it. Agents see the roster.
export default function Team() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [team, setTeam] = useState(null)
  const [listings, setListings] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data, error } = await myTeam()
    if (error) { console.error('Team failed:', error); toast.error('Could not load your team'); setTeam([]); return }
    setTeam(data || [])
    const me = (data || []).find(m => m.user_id === user.id)
    if (me?.is_owner) {
      const ids = (data || []).map(m => m.user_id).filter(id => id !== user.id)
      const { data: ls, error: lerr } = await teamListings(ids)
      if (lerr) console.error('Team listings failed:', lerr)
      setListings(ls || [])
    }
  }

  async function create() {
    if (!name.trim()) { toast.error('Give your brokerage a name'); return }
    setBusy(true)
    const { error } = await createBrokerageFor(user.id, name)
    setBusy(false)
    if (error) { toast.error(error.code === '42501' ? 'Only verified posters can create a brokerage.' : error.message); return }
    toast.success('Brokerage created')
    setName('')
    load()
  }

  async function add() {
    if (!email.trim()) return
    setBusy(true)
    const { data, error } = await addMember(email)
    setBusy(false)
    if (error) { toast.error(error.message || 'Could not add that agent'); return }
    toast.success(`${data?.name || 'Agent'} added`)
    setEmail('')
    load()
  }

  async function remove(member) {
    if (!window.confirm(`Remove ${member.name} from the team?`)) return
    const { data, error } = await removeMember(member.user_id)
    if (error || !data?.length) { toast.error(error?.message || 'Could not remove'); return }
    toast.success('Removed')
    load()
  }

  async function setStatus(listing, newStatus) {
    if (!newStatus || newStatus === listing.status) return
    const { data, error } = await supabase.from('listings').update({ status: newStatus }).eq('id', listing.id).select('id, status').maybeSingle()
    if (error || !data) { toast.error(error?.message || 'The listing was not updated'); return }
    setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: data.status } : l))
    toast.success(`Marked ${statusLabel(newStatus).toLowerCase()}`)
  }

  const me = (team || []).find(m => m.user_id === user.id)
  const isOwner = Boolean(me?.is_owner)
  const brokerageName = team?.[0]?.brokerage_name

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
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, margin: 0 }}>Team</h1>
          <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>{brokerageName || 'Brokerage accounts'}</div>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {team === null ? (
          <div className="center" style={{ padding: '40px' }}><div className="spinner" /></div>
        ) : team.length === 0 ? (
          <div className="card" style={{ padding: '22px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 6px' }}>Create your brokerage</h2>
            <p style={{ fontSize: '13px', color: 'var(--warm-gray)', lineHeight: 1.5, margin: '0 0 14px' }}>
              As the owner you can add your verified agents by email, see all of the team's listings in one place, and update them.
              {!profile?.verified && ' Your account must be verified first.'}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input placeholder="Brokerage name" value={name} maxLength={120} onChange={e => setName(e.target.value)} style={{ flex: 1, minWidth: '180px', padding: '12px', fontSize: '14px' }} />
              <button className="btn-primary" onClick={create} disabled={busy || !profile?.verified} style={{ padding: '12px 18px', fontSize: '14px', opacity: busy || !profile?.verified ? 0.6 : 1 }}>
                Create
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: '12px 0 0' }}>
              Been invited to a team? Ask the owner to add the email you signed up with; the team appears here.
            </p>
          </div>
        ) : (
          <>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Users size={18} color="var(--terracotta)" />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0 }}>{brokerageName}</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {team.map(m => (
                  <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--sand-dark)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{m.name}{m.user_id === user.id ? ' (you)' : ''}</div>
                      {m.email && <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>{m.email}</div>}
                    </div>
                    <span className="tag" style={{ fontSize: '11px' }}>{m.role === 'owner' ? 'Owner' : 'Agent'}</span>
                    {isOwner && m.role === 'agent' && (
                      <button onClick={() => remove(m)} aria-label={`Remove ${m.name}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex' }}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {isOwner ? (
                <div style={{ marginTop: '14px' }}>
                  <label className="label">Add an agent by the email they signed up with</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    <input type="email" placeholder="agent@example.com" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: 1, minWidth: '180px', padding: '12px', fontSize: '14px' }} />
                    <button className="btn-primary" onClick={add} disabled={busy} style={{ padding: '12px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserPlus size={15} /> Add
                    </button>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: '8px 0 0', lineHeight: 1.5 }}>
                    Only verified agents who are not yet on a team can be added. You will see and be able to update their listings; they keep posting under their own name.
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--warm-gray)', margin: '12px 0 0', lineHeight: 1.5 }}>
                  Your team owner can see and update your listings. Leads still come to you.
                </p>
              )}
            </div>

            {isOwner && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 10px' }}>Team listings ({listings.length})</h2>
                {listings.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--warm-gray)' }}>Your agents have not posted anything yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {listings.map(l => {
                      const agent = team.find(m => m.user_id === l.poster_id)
                      return (
                        <div key={l.id} className="card" style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                            <div style={{ minWidth: 0, cursor: 'pointer' }} onClick={() => navigate('/listing/' + l.id)}>
                              <div style={{ fontWeight: 600, fontSize: '15px' }}>{l.address}</div>
                              <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>
                                {l.neighborhood ? `${l.neighborhood}, ` : ''}{l.city} · {agent?.name || 'agent'}
                              </div>
                            </div>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, color: 'var(--terracotta)', flexShrink: 0 }}>{priceText(l)}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--charcoal-soft)' }}>
                              Status
                              <select value={l.status} onChange={e => setStatus(l, e.target.value)} aria-label={`Status for ${l.address}`}
                                style={{ padding: '7px 9px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--sand-dark)', background: 'var(--white)', color: 'var(--charcoal)' }}>
                                {statusesFor(l.listing_type).map(st => <option key={st.id} value={st.id}>{st.label}</option>)}
                              </select>
                            </label>
                            <button onClick={() => navigate(`/edit-listing/${l.id}`)} className="btn-ghost" style={{ fontSize: '12px', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Pencil size={13} /> Edit
                            </button>
                            <span style={{ fontSize: '12px', color: 'var(--warm-gray)', marginLeft: 'auto' }}>{l.views || 0} views</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
