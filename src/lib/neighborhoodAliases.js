// Maps a listing to one of the neighborhoods in ./neighborhoods.js.
//
// Two signals, in order:
//   1. zip_code — but only when the ZIP belongs to exactly ONE neighborhood in
//      our set. Several NYC ZIPs straddle neighborhoods we list separately
//      (11201 covers Brooklyn Heights, DUMBO and Downtown Brooklyn; 11215
//      covers Park Slope and Gowanus), so an ambiguous ZIP is skipped rather
//      than resolved by guesswork.
//   2. the typed `neighborhood` text, normalized and looked up against aliases.
//
// If neither is conclusive, return null. A wrong neighborhood is worse than no
// neighborhood: it would put a listing under a place it is not in.
//
// ZIPs marked // REVIEW are ones to verify — mostly ZIPs whose boundaries do
// not line up cleanly with how the neighborhood is colloquially drawn.

export const NEIGHBORHOOD_ALIASES = {
  // ---------------------------------------------------------------- Brooklyn
  'park-slope': {
    aliases: ['park slope', 'parkslope', 'south slope', 'north slope'],
    zips: ['11215', '11217'], // REVIEW — 11217 also covers Boerum Hill and part of Prospect Heights
  },
  'carroll-gardens': {
    aliases: ['carroll gardens', 'carrollgardens'],
    zips: ['11231'], // REVIEW — 11231 also covers Red Hook and part of Cobble Hill
  },
  'cobble-hill': {
    aliases: ['cobble hill', 'cobblehill'],
    zips: [], // REVIEW — split between 11201 and 11231, no ZIP is uniquely Cobble Hill
  },
  'brooklyn-heights': {
    aliases: ['brooklyn heights', 'bklyn heights', 'bk heights'],
    zips: [], // REVIEW — 11201 is shared with DUMBO and Downtown Brooklyn
  },
  'williamsburg': {
    aliases: ['williamsburg', 'williamsburgh', 'wburg', 'east williamsburg', 'south williamsburg', 'north williamsburg'],
    zips: ['11211', '11249'], // REVIEW — 11206 also reaches East Williamsburg
  },
  'greenpoint': {
    aliases: ['greenpoint', 'green point'],
    zips: ['11222'],
  },
  'bushwick': {
    aliases: ['bushwick'],
    zips: ['11237'], // REVIEW — Bushwick also spans parts of 11206, 11207 and 11221
  },
  'bed-stuy': {
    aliases: [
      'bed stuy', 'bedstuy', 'bedford stuyvesant', 'bedford stuy',
      'stuyvesant heights', 'ocean hill',
    ],
    zips: ['11216', '11233'], // REVIEW — 11221 is shared with Bushwick; 11205 with Clinton Hill
  },
  'crown-heights': {
    aliases: ['crown heights', 'crownheights'],
    zips: ['11213', '11225'], // REVIEW — Crown Heights also reaches 11216 and 11238
  },
  'prospect-heights': {
    aliases: ['prospect heights', 'prospectheights'],
    zips: ['11238'], // REVIEW — 11238 is shared with Clinton Hill
  },
  'fort-greene': {
    aliases: ['fort greene', 'fortgreene', 'ft greene'],
    zips: [], // REVIEW — split across 11205 and 11217, neither uniquely Fort Greene
  },
  'clinton-hill': {
    aliases: ['clinton hill', 'clintonhill'],
    zips: ['11205'], // REVIEW — 11205 is shared with Fort Greene and part of Bed-Stuy
  },
  'bay-ridge': {
    aliases: ['bay ridge', 'bayridge'],
    zips: ['11209'], // REVIEW — Bay Ridge also reaches part of 11220
  },
  'sunset-park': {
    aliases: ['sunset park', 'sunsetpark'],
    zips: ['11232'], // REVIEW — 11220 is shared with Bay Ridge
  },
  'flatbush-ditmas-park': {
    aliases: [
      'flatbush', 'ditmas park', 'ditmaspark', 'flatbush ditmas park',
      'east flatbush', 'prospect park south', 'victorian flatbush',
    ],
    zips: ['11226'], // REVIEW — Ditmas Park West runs into 11218 (Kensington)
  },
  'dumbo': {
    aliases: ['dumbo', 'down under the manhattan bridge overpass', 'vinegar hill'],
    zips: [], // REVIEW — 11201 is shared with Brooklyn Heights and Downtown Brooklyn
  },
  'gowanus': {
    aliases: ['gowanus'],
    zips: [], // REVIEW — Gowanus has no ZIP of its own; it straddles 11215, 11217 and 11231
  },
  'downtown-brooklyn': {
    aliases: ['downtown brooklyn', 'boerum hill'], // REVIEW — Boerum Hill is adjacent, not the same place
    zips: [], // REVIEW — 11201 is shared with Brooklyn Heights and DUMBO
  },

  // --------------------------------------------------------------- Manhattan
  'east-village': {
    aliases: ['east village', 'eastvillage', 'alphabet city', 'ev'],
    zips: ['10009'], // REVIEW — East Village also reaches 10003
  },
  'west-village': {
    aliases: ['west village', 'westvillage', 'greenwich village', 'the west village'],
    zips: ['10014'], // REVIEW — Greenwich Village proper is 10011/10012, treated here as the same area
  },
  'lower-east-side': {
    aliases: ['lower east side', 'lowereastside', 'les', 'two bridges'],
    zips: ['10002'],
  },
  'upper-west-side': {
    aliases: ['upper west side', 'upperwestside', 'uws', 'morningside heights', 'lincoln square'],
    zips: ['10023', '10024', '10025', '10069'], // REVIEW — 10025 also covers Morningside Heights
  },
  'upper-east-side': {
    aliases: ['upper east side', 'uppereastside', 'ues', 'yorkville', 'lenox hill', 'carnegie hill'],
    zips: ['10021', '10028', '10065', '10075', '10128'],
  },
  'harlem': {
    aliases: [
      'harlem', 'central harlem', 'south harlem', 'soha',
      'hamilton heights', 'sugar hill', 'manhattanville',
    ],
    zips: ['10026', '10027', '10030', '10037', '10039'], // REVIEW — 10031 (Hamilton Heights) omitted as it edges into Washington Heights
  },
  'chelsea': {
    aliases: ['chelsea', 'west chelsea'],
    zips: ['10011'], // REVIEW — Chelsea also reaches 10001, which covers Hudson Yards and the Garment District
  },
  'murray-hill': {
    aliases: ['murray hill', 'murrayhill', 'kips bay'], // REVIEW — Kips Bay is adjacent, not the same place
    zips: ['10016'], // REVIEW — 10016 covers Murray Hill and Kips Bay together
  },
  'financial-district': {
    aliases: [
      'financial district', 'fidi', 'fi di', 'wall street',
      'battery park city', 'seaport', 'south street seaport',
    ],
    zips: ['10004', '10005', '10006', '10280'], // REVIEW — 10007 and 10038 straddle Tribeca and the Seaport
  },

  // ------------------------------------------------------------------ Queens
  'astoria': {
    aliases: ['astoria', 'ditmars', 'ditmars steinway', 'steinway'],
    zips: ['11102', '11103', '11105', '11106'],
  },
  'long-island-city': {
    aliases: ['long island city', 'longislandcity', 'lic', 'hunters point', 'court square'],
    zips: ['11101', '11109'],
  },
  'forest-hills': {
    aliases: ['forest hills', 'foresthills', 'forest hills gardens'],
    zips: ['11375'],
  },
}

// Lowercase, strip punctuation, and treat "/" and "-" as spaces, so
// "Bed-Stuy", "bed stuy" and "Flatbush / Ditmas Park" all normalize cleanly.
export function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// alias -> neighborhood id. A duplicate alias across neighborhoods would be
// ambiguous, so the first definition wins and the collision is reported by the
// audit helper below rather than silently resolved.
const ALIAS_INDEX = {}
for (const [id, entry] of Object.entries(NEIGHBORHOOD_ALIASES)) {
  for (const alias of entry.aliases) {
    const key = normalizeName(alias)
    if (!(key in ALIAS_INDEX)) ALIAS_INDEX[key] = id
  }
  // The id itself is always an acceptable spelling.
  if (!(normalizeName(id) in ALIAS_INDEX)) ALIAS_INDEX[normalizeName(id)] = id
}

// zip -> [ids]. Kept as a list so an ambiguous ZIP can be detected, not guessed.
const ZIP_INDEX = {}
for (const [id, entry] of Object.entries(NEIGHBORHOOD_ALIASES)) {
  for (const zip of entry.zips) {
    ;(ZIP_INDEX[zip] ||= []).push(id)
  }
}

function zipOf(listing) {
  const digits = String(listing?.zip_code || '').replace(/\D/g, '')
  return digits.length >= 5 ? digits.slice(0, 5) : ''
}

// Returns a neighborhood id, or null when nothing matches conclusively.
export function matchListingToNeighborhood(listing) {
  if (!listing) return null

  const zip = zipOf(listing)
  const byZip = zip ? ZIP_INDEX[zip] : undefined
  // Only trust a ZIP that belongs to exactly one of our neighborhoods.
  if (byZip && byZip.length === 1) return byZip[0]

  const typed = normalizeName(listing.neighborhood)
  if (typed && ALIAS_INDEX[typed]) return ALIAS_INDEX[typed]

  return null
}

// For scripts and tests: which aliases collide, and which ZIPs are ambiguous.
export function auditAliases() {
  const aliasOwners = {}
  const zipOwners = {}
  for (const [id, entry] of Object.entries(NEIGHBORHOOD_ALIASES)) {
    for (const alias of entry.aliases) {
      ;(aliasOwners[normalizeName(alias)] ||= []).push(id)
    }
    for (const zip of entry.zips) {
      ;(zipOwners[zip] ||= []).push(id)
    }
  }
  return {
    duplicateAliases: Object.entries(aliasOwners).filter(([, ids]) => ids.length > 1),
    ambiguousZips: Object.entries(zipOwners).filter(([, ids]) => ids.length > 1),
  }
}
