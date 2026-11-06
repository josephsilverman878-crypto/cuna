import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone, ExternalLink, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { fetchLeads, setLeadStatus, LEAD_STATUSES, leadStatusLabel, mailtoFor } from '../lib/leads'
import { documentUrl, documentLabel } from '../lib/applications'

// Date-only strings ("2026-12-01") must not go through new Date(str), which
// reads them as UTC midnight and shows the previous day in New York.
function dateOnly(d) {
  if (!d) return ''
  const [y, m, day] = String(d).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString()
}

// Every tour request and question on the poster's listings, in one list,
// with a status the poster sets, filters, and a link back into the email
// thread. Renter fields are the inquiry's own shared_* snapshot (what the
// renter chose to share when they sent it), never a live profile read.

const STATUS_COLORS = {
  new: ['rgba(196,113,74,0.14)', 'var(--terracotta)'],
  replied: ['rgba(76,175,125,0.15)', 'var(--like-green)'],
  toured: ['rgba(139,99,85,0.15)', 'var(--clay)'],
  closed: ['rgba(155,142,136,0.15)', 'var(--warm-gray)'],
}

export default function LeadInbox({ compact = false }) {
  const navigate = useNavigate()
  const [leads, setLeads] = useState(null)
  const [addresses, setAddresses] = useState({})
  const [failed, setFailed] = useState(false)
  const [status, setStatus] = useState('open')
  const [kind, setKind] = useState('all')
  const [listingFilter, setListingFilter] = useState('all')
  const [busy, setBusy] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setFailed(false)
    setLeads(null)
    const { data, error } = await fetchLeads()
    if (error) { console.error('Leads failed:', error); setFailed(true); setLeads([]); return }
    const rows = data || []
    setLeads(rows)
    const ids = [...new Set(rows.map(r => r.listing_id))]
    if (ids.length) {
      const { data: ls } = await supabase.from('listings').select('id, address').in('id', ids)
      const map = {}
      ;(ls || []).forEach(l => { map[l.id] = l.address })
      setAddresses(map)
    }
  }

  async function changeStatus(lead, next) {
    if (next === lead.status) return
    setBusy(lead.inquiry_id)
    const { data, error } = await setLeadStatus(lead.inquiry_id, next)
    setBusy(null)
    if (error || !data) { toast.error(error?.message || 'Could not update the status'); return }
    setLeads(prev => prev.map(l => l.inquiry_id === lead.inquiry_id ? { ...l, status: data.status, status_changed_at: data.status_changed_at } : l))
    toast.success(`Marked ${leadStatusLabel(next).toLowerCase()}`)
  }

  const visible = useMemo(() => (leads || []).filter(l =>
    (status === 'all' || (status === 'open' ? l.status !== 'closed' : l.status === status)) &&
    (kind === 'all' || l.kind === kind) &&
    (listingFilter === 'all' || l.listing_id === listingFilter)
  ), [leads, status, kind, listingFilter])

  const counts = useMemo(() => {
    const c = { all: 0, open: 0 }
    LEAD_STATUSES.forEach(s => { c[s.id] = 0 })
    ;(leads || []).forEach(l => { c.all++; c[l.status] = (c[l.status] || 0) + 1; if (l.status !== 'closed') c.open++ })
    return c
  }, [leads])

  const pill = (on) => ({
    padding: '7px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap',
    background: on ? 'var(--terracotta)' : 'var(--white)', color: on ? 'white' : 'var(--warm-gray)',
    border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
  })

  if (leads === null) return <div className="center" style={{ padding: '40px' }}><div className="spinner" /></div>

  if (failed) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 24px', color: 'var(--warm-gray)' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
        <p style={{ fontWeight: 600, color: 'var(--charcoal)' }}>Could not load your leads.</p>
        <p style={{ fontSize: '13px', marginTop: '6px' }}>This is a loading problem, not an empty inbox.</p>
        <button className="btn-secondary" onClick={load} style={{ marginTop: '16px', padding: '10px 20px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        <button onClick={() => setStatus('open')} style={pill(status === 'open')}>Open ({counts.open})</button>
        {LEAD_STATUSES.map(s => (
          <button key={s.id} onClick={() => setStatus(s.id)} style={pill(status === s.id)}>{s.label} ({counts[s.id] || 0})</button>
        ))}
        <button onClick={() => setStatus('all')} style={pill(status === 'all')}>All ({counts.all})</button>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={kind} onChange={e => setKind(e.target.value)} aria-label="Kind" style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '10px', border: '1px solid var(--sand-dark)', background: 'var(--white)' }}>
          <option value="all">Tours and questions</option>
          <option value="tour">Tour requests</option>
          <option value="question">Questions</option>
        </select>
        {Object.keys(addresses).length > 1 && (
          <select value={listingFilter} onChange={e => setListingFilter(e.target.value)} aria-label="Listing" style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '10px', border: '1px solid var(--sand-dark)', background: 'var(--white)', maxWidth: '100%' }}>
            <option value="all">All listings</option>
            {Object.entries(addresses).map(([id, address]) => <option key={id} value={id}>{address}</option>)}
          </select>
        )}
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--warm-gray)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📩</div>
          <p style={{ fontSize: '14px' }}>{counts.all === 0 ? 'No tour requests or questions yet.' : 'Nothing matches these filters.'}</p>
        </div>
      ) : visible.slice(0, compact ? 5 : undefined).map(lead => {
        const [bg, fg] = STATUS_COLORS[lead.status] || STATUS_COLORS.new
        const address = addresses[lead.listing_id]
        const mailto = mailtoFor(lead, address)
        return (
          <div key={lead.inquiry_id} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{lead.renter_name || 'Renter'}</div>
                <button type="button" onClick={() => navigate('/listing/' + lead.listing_id)} style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
                  fontSize: '13px', color: 'var(--warm-gray)', marginTop: '2px',
                }}>
                  {address || 'Listing'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 9px', borderRadius: '20px', background: 'var(--sand)', color: 'var(--charcoal-soft)' }}>
                  {lead.kind === 'question' ? 'Question' : lead.tour_type === 'video' ? 'Video tour' : 'In person'}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 9px', borderRadius: '20px', background: bg, color: fg }}>
                  {leadStatusLabel(lead.status)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', margin: '10px 0' }}>
              {lead.renter_email && (
                <a href={mailto} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--terracotta)', textDecoration: 'none', fontWeight: 500 }}>
                  <Mail size={13} /> {lead.renter_email}
                </a>
              )}
              {lead.shared_phone && (
                <a href={'tel:' + lead.shared_phone} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warm-gray)', textDecoration: 'none' }}>
                  <Phone size={13} /> {lead.shared_phone}
                </a>
              )}
            </div>

            {(lead.shared_move_in_date || typeof lead.shared_has_pets === 'boolean' || lead.shared_credit_score_range) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {lead.shared_move_in_date && <span className="tag">🗓 Move in {dateOnly(lead.shared_move_in_date)}</span>}
                {lead.shared_has_pets === true && <span className="tag">🐾 Has pets{lead.shared_pet_details ? ` — ${lead.shared_pet_details}` : ''}</span>}
                {lead.shared_has_pets === false && <span className="tag">No pets</span>}
                {lead.shared_credit_score_range && <span className="tag">📊 Credit: {lead.shared_credit_score_range.replace('_', '-')}</span>}
              </div>
            )}

            {(lead.preferred_times || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {lead.preferred_times.map((t, i) => <span key={i} className="tag">{t}</span>)}
              </div>
            )}

            {lead.message && (
              <p style={{ fontSize: '13px', color: 'var(--charcoal-soft)', lineHeight: 1.5, background: 'var(--sand)', padding: '10px 12px', borderRadius: '8px', margin: '0 0 10px' }}>
                {lead.message}
              </p>
            )}

            {lead.shared_application && (
              <div style={{ fontSize: '13px', background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.25)', padding: '10px 12px', borderRadius: '8px', margin: '0 0 10px', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Rental application (shared by the renter)</div>
                {lead.shared_application.employer && <div>Work: {lead.shared_application.job_title ? `${lead.shared_application.job_title}, ` : ''}{lead.shared_application.employer}</div>}
                {lead.shared_application.annual_income != null && <div>Annual income: ${Number(lead.shared_application.annual_income).toLocaleString()}</div>}
                {lead.shared_application.move_in_date && <div>Move-in: {dateOnly(lead.shared_application.move_in_date)}</div>}
                {lead.shared_application.current_address && <div>Current address: {lead.shared_application.current_address}</div>}
                {(lead.shared_application.references || []).length > 0 && (
                  <div>References: {lead.shared_application.references.map(r => [r.name, r.relationship, r.contact].filter(Boolean).join(' · ')).join('; ')}</div>
                )}
                {lead.shared_application.notes && <div>Notes: {lead.shared_application.notes}</div>}
                {(lead.shared_documents || []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {lead.shared_documents.map(p => (
                      <button key={p} type="button" className="btn-ghost" style={{ fontSize: '12px', padding: '5px 9px' }}
                        onClick={async () => { try { window.open(await documentUrl(p), '_blank', 'noopener') } catch (err) { toast.error(err.message || 'Could not open the file') } }}>
                        {documentLabel(p)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--charcoal-soft)' }}>
                Status
                <select value={lead.status} disabled={busy === lead.inquiry_id} onChange={e => changeStatus(lead, e.target.value)}
                  aria-label={`Status for ${lead.renter_name || 'lead'}`}
                  style={{ padding: '7px 9px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--sand-dark)', background: 'var(--white)', color: 'var(--charcoal)' }}>
                  {LEAD_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </label>
              {mailto && (
                <a href={mailto} className="btn-ghost" style={{ fontSize: '12px', padding: '7px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}>
                  Reply by email <ExternalLink size={12} />
                </a>
              )}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--warm-gray)', marginTop: '8px' }}>
              Received {new Date(lead.created_at).toLocaleString()}
              {lead.status_changed_at ? ` · ${leadStatusLabel(lead.status)} ${new Date(lead.status_changed_at).toLocaleDateString()}` : ''}
            </div>
          </div>
        )
      })}
      {compact && visible.length > 5 && (
        <button className="btn-secondary" onClick={() => navigate('/leads')} style={{ alignSelf: 'center', padding: '10px 20px', fontSize: '14px' }}>
          Open the full inbox ({visible.length})
        </button>
      )}
    </div>
  )
}
