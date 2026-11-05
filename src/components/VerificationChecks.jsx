import { useState } from 'react'
import { Search, Home } from 'lucide-react'
import { compareLicense } from '../lib/licenseCheck'
import { compareOwner } from '../lib/ownerCheck'

// /admin: on-demand checks of a poster against public records. Both read
// public NYC / NY State open data from the admin's browser and show a
// comparison; approval stays a manual click.
//
//   License: NY DOS Active Real Estate Licensees (data.ny.gov yg7h-zjbf)
//   Owner:   PLUTO recorded owner for the lot the poster named (NYC Open Data 64uk-42ks)

const VERDICT = {
  match: ['Matches the public record', 'var(--like-green)'],
  partial: ['Name, type and expiry match; brokerage differs', 'var(--terracotta)'],
  mismatch: ['Does not match the public record', 'var(--pass-red)'],
  not_found: ['Not in the active-licensee dataset', 'var(--pass-red)'],
  owner: ['Owner account: not licensed', 'var(--warm-gray)'],
  no_match: ['Recorded owner does not match this account', 'var(--pass-red)'],
  no_bbl: ['No property address on file', 'var(--warm-gray)'],
}

function Mark({ ok }) {
  if (ok === null || ok === undefined) return <span style={{ color: 'var(--warm-gray)' }}>–</span>
  return <span style={{ color: ok ? 'var(--like-green)' : 'var(--pass-red)', fontWeight: 700 }}>{ok ? '✓' : '✗'}</span>
}

export default function VerificationChecks({ poster }) {
  const [license, setLicense] = useState(null)
  const [owner, setOwner] = useState(null)
  const [busy, setBusy] = useState(null)

  async function runLicense() {
    setBusy('license')
    try { setLicense(await compareLicense(poster)) }
    catch (err) { setLicense({ verdict: 'error', note: err.message }) }
    setBusy(null)
  }

  async function runOwner() {
    setBusy('owner')
    try { setOwner(await compareOwner(poster)) }
    catch (err) { setOwner({ verdict: 'error', note: err.message }) }
    setBusy(null)
  }

  const Verdict = ({ v, note }) => {
    const [label, color] = VERDICT[v] || [note || 'Check failed', 'var(--pass-red)']
    return (
      <div style={{ fontSize: '13px', fontWeight: 600, color, marginTop: '8px' }}>{label}</div>
    )
  }

  const isOwner = poster.license_type === 'owner'

  return (
    <div style={{ borderTop: '1px solid var(--sand-dark)', paddingTop: '12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <button type="button" onClick={runLicense} disabled={busy === 'license' || isOwner} className="btn-ghost"
          style={{ fontSize: '13px', padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: isOwner ? 0.5 : 1 }}>
          <Search size={14} /> {busy === 'license' ? 'Checking NY DOS…' : 'Check license against NY DOS'}
        </button>
        {license && (
          <div style={{ marginTop: '6px' }}>
            <Verdict v={license.verdict} note={license.note} />
            {license.note && <div style={{ fontSize: '12px', color: 'var(--warm-gray)', marginTop: '4px' }}>{license.note}</div>}
            {license.checks?.length > 0 && (
              <div style={{ marginTop: '6px', fontSize: '12px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 10px' }}>
                {license.checks.map(c => (
                  <div key={c.label} style={{ display: 'contents' }}>
                    <div><Mark ok={c.ok} /> {c.label}</div>
                    <div style={{ color: 'var(--charcoal-soft)', minWidth: 0, wordBreak: 'break-word' }}>
                      {c.ours ? <>{c.ours} <span style={{ color: 'var(--warm-gray)' }}>· DOS:</span> </> : null}{c.theirs || '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <button type="button" onClick={runOwner} disabled={busy === 'owner'} className="btn-ghost"
          style={{ fontSize: '13px', padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Home size={14} /> {busy === 'owner' ? 'Checking PLUTO…' : 'Check property owner (PLUTO)'}
        </button>
        {poster.owner_property_address && (
          <div style={{ fontSize: '12px', color: 'var(--warm-gray)', marginTop: '4px' }}>
            Says they own: {poster.owner_property_address}{poster.owner_property_bbl ? ` (BBL ${poster.owner_property_bbl})` : ''}
          </div>
        )}
        {owner && (
          <div style={{ marginTop: '6px' }}>
            <Verdict v={owner.verdict} note={owner.note} />
            {owner.note && <div style={{ fontSize: '12px', color: 'var(--warm-gray)', marginTop: '4px' }}>{owner.note}</div>}
            {owner.lot && (
              <div style={{ fontSize: '12px', color: 'var(--charcoal-soft)', marginTop: '4px' }}>
                PLUTO: {owner.lot.address} · owner {owner.lot.ownername} · built {owner.lot.yearbuilt || '?'} · {owner.lot.unitsres || '?'} residential units
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
