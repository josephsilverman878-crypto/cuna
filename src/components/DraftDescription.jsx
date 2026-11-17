import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { aiFeature, aiRequest } from '../lib/ai'
import AiLabel from './AiLabel'

// "Draft description" on Post listing and Edit listing (AI phase 3). Sends
// only fields the poster already entered (never the street address) and
// shows the draft for them to accept or dismiss; nothing is written into
// the form until they tap "Use this draft". The form's own fair-housing
// check runs on whatever ends up in the box, as it always has.

const AMENITY_LABELS = {
  doorman: 'Doorman', elevator: 'Elevator', gym: 'Gym', laundry: 'Laundry', dishwasher: 'Dishwasher',
  hardwood: 'Hardwood floors', roof_deck: 'Roof deck', central_air: 'Central air', washer_dryer: 'Washer/dryer',
  parking: 'Parking', storage: 'Storage',
}

export function draftFields(form) {
  return {
    listing_type: form.listing_type, property_type: form.property_type, neighborhood: form.neighborhood,
    bedrooms: form.bedrooms, bathrooms: form.bathrooms, sqft: form.sqft, price: form.price,
    available_date: form.available_date, lease_term_months: form.lease_term_months, months_free: form.months_free,
    pets_policy: form.pets_policy,
    amenities: Object.entries(AMENITY_LABELS).filter(([k]) => form[k]).map(([, v]) => v),
  }
}

export default function DraftDescription({ form, onUse }) {
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState(null)
  const [message, setMessage] = useState(null)
  if (!aiFeature('draft')) return null

  async function run() {
    setBusy(true); setMessage(null)
    const r = await aiRequest('draft', { fields: draftFields(form) })
    setBusy(false)
    if (!r.ok) { setMessage(r.message); return }
    if (r.output?.kind === 'message') { setMessage(r.output.message); return }
    setDraft(r.output.text)
  }

  return (
    <div style={{ marginTop: '12px' }}>
      <button type="button" onClick={run} disabled={busy} className="btn btn-secondary"
        style={{ padding: '9px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <Sparkles size={14} aria-hidden="true" /> {busy ? 'Drafting…' : draft ? 'Draft again' : 'Draft description'}
      </button>
      {message && <p role="status" style={{ fontSize: '13px', lineHeight: 1.5, margin: '10px 0 0' }}>{message}</p>}
      {draft && (
        <div style={{ marginTop: '12px', background: 'var(--white)', border: '1px solid var(--sand-dark)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
          <p style={{ fontSize: '14px', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{draft}</p>
          <p style={{ fontSize: '12px', color: 'var(--warm-gray)', lineHeight: 1.5, margin: '10px 0 0' }}>
            Drafted from the details you entered. Read it and fix anything that is not right before you post; you are responsible for the description. It is checked for fair-housing language again when you save.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            <button type="button" className="btn btn-primary" style={{ padding: '9px 14px', fontSize: '13px' }}
              onClick={() => { onUse(draft); setDraft(null) }}>
              {form.description?.trim() ? 'Replace my description with this' : 'Use this draft'}
            </button>
            <button type="button" className="btn btn-secondary" style={{ padding: '9px 14px', fontSize: '13px' }} onClick={() => setDraft(null)}>Dismiss</button>
          </div>
        </div>
      )}
      <AiLabel style={{ marginTop: '10px' }} />
    </div>
  )
}
