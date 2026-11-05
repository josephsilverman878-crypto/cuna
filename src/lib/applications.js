import { supabase } from './supabase'

// Rental applications (wave 5, item 5.6; 47-wave5-applications.sql).
//
// A renter fills in one reusable application: employer, job title, annual
// income (an amount, never a source), move-in date, current address, up to
// three references, notes and up to five documents in the private
// "applications" bucket under their own folder. Only the renter can read
// it. Sharing happens one tour request at a time: RequestTour copies a
// snapshot into inquiries.shared_application and the document paths into
// shared_documents, and the poster of that listing (nobody else) can then
// read those files through the storage policy.
//
// Never collected: SSN, bank or card numbers, source of income. The
// database CHECK refuses SSN- and card-shaped digit runs; the validator
// below catches them before the round trip.
//
// Flag: VITE_APPLICATIONS_ENABLED=true shows the feature. It stays off
// until 47 has been applied to the database.

export const APPLICATIONS_ENABLED = String(import.meta.env.VITE_APPLICATIONS_ENABLED || '') === 'true'
export const BUCKET = 'applications'
export const MAX_DOCUMENTS = 5
export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

const SSN = /\d{3}-\d{2}-\d{4}/
const CARD = /\d{13,19}/

// Returns a message when a free-text field carries something we must not store.
export function sensitiveProblem(text) {
  const t = String(text || '')
  if (SSN.test(t)) return 'Please remove the Social Security number. Cuna never asks for it.'
  if (CARD.test(t.replace(/[\s-]/g, ''))) return 'Please remove the account or card number. Cuna never asks for it.'
  return null
}

export function validateApplication(app) {
  const problems = []
  for (const [k, label] of [['notes', 'Notes'], ['employer', 'Employer'], ['job_title', 'Job title'], ['current_address', 'Current address']]) {
    const p = sensitiveProblem(app[k])
    if (p) problems.push(`${label}: ${p}`)
  }
  ;(app.references_list || []).forEach((r, i) => {
    const p = sensitiveProblem(`${r.name} ${r.relationship} ${r.contact}`)
    if (p) problems.push(`Reference ${i + 1}: ${p}`)
  })
  if (app.annual_income !== '' && app.annual_income !== null && app.annual_income !== undefined) {
    const n = Number(app.annual_income)
    if (!Number.isFinite(n) || n < 0 || n > 100000000) problems.push('Annual income must be a whole dollar amount.')
  }
  if ((app.references_list || []).length > 3) problems.push('Up to three references.')
  return problems
}

export async function getMyApplication(userId) {
  return supabase.from('renter_applications').select('*').eq('id', userId).maybeSingle()
}

export async function saveMyApplication(userId, app) {
  const row = {
    id: userId,
    employer: app.employer?.trim() || null,
    job_title: app.job_title?.trim() || null,
    annual_income: app.annual_income === '' || app.annual_income === null || app.annual_income === undefined ? null : Math.round(Number(app.annual_income)),
    move_in_date: app.move_in_date || null,
    current_address: app.current_address?.trim() || null,
    references_list: (app.references_list || []).filter(r => r.name?.trim()).slice(0, 3).map(r => ({
      name: r.name.trim().slice(0, 80), relationship: (r.relationship || '').trim().slice(0, 60), contact: (r.contact || '').trim().slice(0, 120),
    })),
    notes: app.notes?.trim() || null,
    documents: app.documents || [],
  }
  return supabase.from('renter_applications').upsert(row, { onConflict: 'id' }).select('*').single()
}

export async function uploadDocument(userId, file) {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('PDF, JPEG or PNG only')
  if (file.size > MAX_FILE_BYTES) throw new Error('Each file must be under 10 MB')
  const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 60)
  const path = `${userId}/${Date.now()}-${safe}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  return path
}

// The object row goes through delete_my_application_file() (own folder
// only); the row's absence makes the blob unreachable.
export async function deleteDocument(path) {
  return supabase.rpc('delete_my_application_file', { p_name: path })
}

// 10-minute link for a file the caller may read (the renter for their own
// files, the poster for files shared on an inquiry addressed to them).
export async function documentUrl(path) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 600)
  if (error) throw error
  return data.signedUrl
}

export async function deleteMyApplication(userId, documents = []) {
  for (const p of documents) {
    const { error } = await deleteDocument(p)
    if (error) console.error('document delete failed:', p, error)
  }
  return supabase.from('renter_applications').delete().eq('id', userId).select('id')
}

export function documentLabel(path) {
  return String(path || '').split('/').pop().replace(/^\d+-/, '')
}

// What RequestTour copies onto the inquiry when the renter ticks "share".
export function snapshotOf(app) {
  if (!app) return null
  return {
    employer: app.employer || null, job_title: app.job_title || null, annual_income: app.annual_income ?? null,
    move_in_date: app.move_in_date || null, current_address: app.current_address || null,
    references: app.references_list || [], notes: app.notes || null, shared_at: new Date().toISOString(),
  }
}
