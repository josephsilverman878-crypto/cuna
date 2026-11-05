// Bulk posting by CSV (wave 4, item 4.7). A template the poster downloads,
// a parser for what they upload, row-by-row validation that reuses the
// single-listing rules (listingQuality.js + fairHousing.js), and the insert
// payload for a validated row. Nothing is created until the poster has seen
// the preview and pressed the button.

import { validateListing } from './listingQuality'
import { PETS_POLICY_OPTIONS } from './petsPolicy'
import { PROPERTY_TYPES } from './listingTypes'

export const CSV_COLUMNS = [
  { key: 'address', required: true, help: 'Street address with unit, e.g. 342 9th Street #3' },
  { key: 'city', required: true, help: 'Brooklyn, Manhattan, Queens, Bronx or Staten Island' },
  { key: 'zip_code', required: false, help: '5 digits' },
  { key: 'listing_type', required: true, help: 'rent or sale' },
  { key: 'property_type', required: false, help: 'sale only: condo, coop, townhouse, multi_family' },
  { key: 'price', required: true, help: 'monthly rent or sale price, digits only' },
  { key: 'bedrooms', required: true, help: '0 for a studio' },
  { key: 'bathrooms', required: true, help: 'e.g. 1 or 1.5' },
  { key: 'sqft', required: false, help: '' },
  { key: 'description', required: false, help: 'the apartment, not the tenant you want' },
  { key: 'pets_policy', required: true, help: 'allowed, cats_only or none' },
  { key: 'available_date', required: false, help: 'YYYY-MM-DD' },
  { key: 'security_deposit', required: true, help: 'rentals: dollars, 0 if none' },
  { key: 'application_fee', required: true, help: 'rentals: dollars, 0 if none' },
  { key: 'move_in_fee', required: true, help: 'rentals: dollars, 0 if none' },
  { key: 'lease_term_months', required: false, help: 'rentals: 1-36, default 12' },
  { key: 'months_free', required: false, help: 'rentals: free months on the lease, default 0' },
  { key: 'amenities', required: false, help: 'separated by |, e.g. Doorman|Elevator|Laundry' },
  { key: 'photo_urls', required: true, help: 'at least 3 public image links separated by |' },
  { key: 'common_charges', required: false, help: 'sale: monthly' },
  { key: 'maintenance', required: false, help: 'sale (co-op): monthly' },
  { key: 'monthly_taxes', required: false, help: 'sale: monthly' },
]

const AMENITY_WORDS = ['Doorman', 'Elevator', 'Gym', 'Laundry', 'Dishwasher', 'Hardwood floors', 'Roof deck', 'Central air', 'Washer/dryer', 'Parking', 'Storage']

function csvCell(v) {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function templateCsv() {
  const header = CSV_COLUMNS.map(c => c.key).join(',')
  const helpRow = CSV_COLUMNS.map(c => csvCell(c.help)).join(',')
  const example = [
    '342 9th Street #3', 'Brooklyn', '11215', 'rent', '', '3400', '1', '1', '650',
    'Sunny one-bedroom with a renovated kitchen, hardwood floors and a south-facing living room.',
    'cats_only', '2026-12-01', '3400', '20', '0', '12', '1', 'Laundry|Dishwasher|Hardwood floors',
    'https://example.com/photo1.jpg|https://example.com/photo2.jpg|https://example.com/photo3.jpg', '', '', '',
  ].map(csvCell).join(',')
  return `${header}\n${helpRow}\n${example}\n`
}

// RFC 4180-style parser: quoted fields, doubled quotes, CRLF or LF.
export function parseCsv(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
  const src = String(text || '').replace(/^﻿/, '')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += ch
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  const nonEmpty = rows.filter(r => r.some(c => String(c).trim() !== ''))
  if (!nonEmpty.length) return { header: [], records: [] }
  const header = nonEmpty[0].map(h => h.trim().toLowerCase())
  const records = nonEmpty.slice(1).map((r, idx) => {
    const o = { _line: idx + 2 }
    header.forEach((h, j) => { o[h] = (r[j] ?? '').trim() })
    return o
  })
  // The template's second row is the help row; drop it if it came back.
  return { header, records: records.filter(r => !(r.address || '').startsWith('Street address with unit')) }
}

function splitList(v) {
  return String(v || '').split('|').map(s => s.trim()).filter(Boolean)
}

// Turns a CSV record into the form shape validateListing() expects, then
// adds the CSV-specific checks. Returns { form, photos, errors: [string] }.
export function validateRow(rec) {
  const errors = []
  const listingType = (rec.listing_type || 'rent').toLowerCase() === 'sale' ? 'sale' : (rec.listing_type || '').toLowerCase() === 'rent' || !rec.listing_type ? 'rent' : null
  if (!listingType) errors.push('listing_type must be rent or sale')
  const form = {
    address: rec.address || '', city: rec.city || '', state: 'NY', zip_code: rec.zip_code || '',
    listing_type: listingType || 'rent',
    property_type: (rec.property_type || '').toLowerCase(),
    price: rec.price || '', bedrooms: rec.bedrooms || '', bathrooms: rec.bathrooms || '', sqft: rec.sqft || '',
    description: rec.description || '', pets_policy: (rec.pets_policy || '').toLowerCase(),
    available_date: rec.available_date || '',
    security_deposit: rec.security_deposit ?? '', application_fee: rec.application_fee ?? '', move_in_fee: rec.move_in_fee ?? '',
    lease_term_months: rec.lease_term_months || '12', months_free: rec.months_free || '0',
    common_charges: rec.common_charges || '', maintenance: rec.maintenance || '', monthly_taxes: rec.monthly_taxes || '',
  }
  const photos = splitList(rec.photo_urls).filter(u => /^https?:\/\//i.test(u))

  CSV_COLUMNS.filter(c => c.required).forEach(c => {
    if (c.key === 'photo_urls') return
    if (['security_deposit', 'application_fee', 'move_in_fee'].includes(c.key) && form.listing_type === 'sale') return
    if (!String(rec[c.key] ?? '').trim()) errors.push(`${c.key} is required`)
  })
  if (!/^[A-Za-z .'-]+$/.test(form.city) || !['brooklyn', 'manhattan', 'queens', 'bronx', 'the bronx', 'staten island', 'new york'].includes(form.city.toLowerCase())) {
    errors.push('city must be a New York City borough')
  }
  if (form.zip_code && !/^\d{5}$/.test(form.zip_code)) errors.push('zip_code must be 5 digits')
  if (!/^\d+$/.test(String(form.price))) errors.push('price must be digits only')
  if (!/^\d+$/.test(String(form.bedrooms))) errors.push('bedrooms must be a whole number')
  if (!/^\d+(\.5)?$/.test(String(form.bathrooms))) errors.push('bathrooms must be a number like 1 or 1.5')
  if (form.sqft && !/^\d+$/.test(form.sqft)) errors.push('sqft must be digits only')
  if (!PETS_POLICY_OPTIONS.some(o => o.value === form.pets_policy)) errors.push('pets_policy must be allowed, cats_only or none')
  if (form.available_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.available_date)) errors.push('available_date must be YYYY-MM-DD')
  if (form.listing_type === 'sale' && !PROPERTY_TYPES.some(t => t.value === form.property_type)) {
    errors.push(`property_type must be one of ${PROPERTY_TYPES.map(t => t.value).join(', ')} for a sale`)
  }
  if (form.listing_type === 'rent') {
    const term = Number(form.lease_term_months), free = Number(form.months_free)
    if (!(term >= 1 && term <= 36)) errors.push('lease_term_months must be 1-36')
    if (!(free >= 0 && free < term)) errors.push('months_free must be less than the lease term')
  }
  const unknownAmenities = splitList(rec.amenities).filter(a => !AMENITY_WORDS.some(w => w.toLowerCase() === a.toLowerCase()))
  if (unknownAmenities.length) errors.push(`unknown amenities: ${unknownAmenities.join(', ')} (allowed: ${AMENITY_WORDS.join(', ')})`)

  validateListing({ form, photoCount: photos.length }).forEach(e => errors.push(e.message))
  return { form, photos, amenities: splitList(rec.amenities).map(a => AMENITY_WORDS.find(w => w.toLowerCase() === a.toLowerCase())).filter(Boolean), errors }
}

export function rowToInsert({ form, photos, amenities }, posterId, geo, neighborhoodName) {
  const isSale = form.listing_type === 'sale'
  const num = v => (v === '' || v === null || v === undefined ? null : Number(v))
  return {
    poster_id: posterId,
    source_platform: 'csv',
    address: form.address, city: form.city, state: 'NY',
    zip_code: form.zip_code || geo?.zip || null,
    neighborhood: neighborhoodName || null,
    lat: geo?.lat ?? null, lng: geo?.lng ?? null, bbl: geo?.bbl ?? null, bin: geo?.bin ?? null,
    geocode_label: geo?.label ?? null, geocoded_at: geo ? new Date().toISOString() : null,
    listing_type: form.listing_type,
    property_type: isSale ? form.property_type : null,
    price: Number(form.price), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms),
    sqft: num(form.sqft),
    description: form.description || null,
    pets_policy: form.pets_policy,
    available_date: form.available_date || null,
    security_deposit: isSale ? null : num(form.security_deposit),
    application_fee: isSale ? null : num(form.application_fee),
    move_in_fee: isSale ? null : num(form.move_in_fee),
    other_fees: [],
    lease_term_months: isSale ? 12 : Number(form.lease_term_months || 12),
    months_free: isSale ? 0 : Number(form.months_free || 0),
    common_charges: isSale ? num(form.common_charges) : null,
    maintenance: isSale ? num(form.maintenance) : null,
    monthly_taxes: isSale ? num(form.monthly_taxes) : null,
    amenities,
    photos,
    floor_plans: [],
    status: 'active',
  }
}
