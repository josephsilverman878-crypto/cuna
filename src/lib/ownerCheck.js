// Owner verification against public NYC property records: PLUTO (NYC Open
// Data 64uk-42ks) gives the recorded owner name for a tax lot (BBL). The
// poster supplies the property address on their profile; the address is
// geocoded to a BBL by the same NYC GeoSearch call the listing form uses.
// This is a comparison for Joseph to look at in /admin; it approves nobody.
//
// PLUTO fields (checked 2026-11-05): bbl, address, ownername, ownertype,
// yearbuilt, unitsres, unitstotal, numfloors, bldgclass, zipcode.

const PLUTO = 'https://data.cityofnewyork.us/resource/64uk-42ks.json'

function tokens(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').split(/\s+/)
    .filter(t => t.length > 2 && !['LLC', 'INC', 'CORP', 'THE', 'AND', 'REALTY', 'ASSOCIATES', 'HOLDINGS', 'TRUST', 'LP', 'ESTATE'].includes(t))
}

export async function lookupPluto(bbl) {
  const b = String(bbl || '').trim()
  if (!/^[1-5][0-9]{9}$/.test(b)) throw new Error('A BBL is 10 digits')
  const url = `${PLUTO}?bbl=${b}&$select=bbl,address,ownername,ownertype,yearbuilt,unitsres,unitstotal,numfloors,bldgclass,zipcode`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`NYC Open Data answered ${res.status}`)
  const rows = await res.json()
  return rows[0] || null
}

// profile: { name, license_name, brokerage_name, owner_property_bbl, owner_property_address }
// verdict: 'match' (a name token overlaps), 'no_match', 'not_found', 'no_bbl'
export async function compareOwner(profile) {
  if (!profile.owner_property_bbl) {
    return { verdict: 'no_bbl', lot: null, note: 'The poster has not given a property address yet (Profile → Owner verification).' }
  }
  const lot = await lookupPluto(profile.owner_property_bbl)
  if (!lot) return { verdict: 'not_found', lot: null, note: 'PLUTO has no lot with this BBL.' }
  const owner = tokens(lot.ownername)
  const ours = new Set([...tokens(profile.name), ...tokens(profile.license_name), ...tokens(profile.brokerage_name)])
  const overlap = owner.filter(t => ours.has(t))
  return {
    verdict: overlap.length ? 'match' : 'no_match',
    lot,
    overlap,
    note: overlap.length
      ? `The recorded owner "${lot.ownername}" shares "${overlap.join(', ')}" with this account.`
      : `The recorded owner is "${lot.ownername}". Nothing in the account name or brokerage matches; an LLC owner may still be this person (ask for the operating agreement or a deed).`,
  }
}
