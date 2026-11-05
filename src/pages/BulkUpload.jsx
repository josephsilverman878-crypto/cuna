import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Download, Upload, Check, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { templateCsv, parseCsv, validateRow, rowToInsert, CSV_COLUMNS } from '../lib/csvListings'
import { geocodeAddress } from '../lib/geocode'
import { isDuplicateAddressError, DUPLICATE_ADDRESS_MESSAGE } from '../lib/flags'

// /bulk: post many listings from one CSV. Download the template, fill it in,
// upload it, read the row-by-row preview, then create the valid rows. Every
// row passes the same rules as the single-listing form (fair housing scan,
// FARE fee fields, price band, 3+ photos). Nothing is written before the
// button at the bottom is pressed. Verified posters only (the database
// refuses an unverified poster's listing anyway).
export default function BulkUpload() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [rows, setRows] = useState(null)
  const [fileName, setFileName] = useState('')
  const [creating, setCreating] = useState(false)
  const [progress, setProgress] = useState('')
  const [results, setResults] = useState(null)

  function downloadTemplate() {
    const blob = new Blob([templateCsv()], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cuna-listings-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResults(null)
    const text = await file.text()
    const { header, records } = parseCsv(text)
    const missing = CSV_COLUMNS.filter(c => c.required && !header.includes(c.key)).map(c => c.key)
    if (missing.length) {
      toast.error(`The file is missing columns: ${missing.join(', ')}. Start from the template.`)
      setRows(null)
      return
    }
    if (!records.length) { toast.error('No listing rows found'); setRows(null); return }
    if (records.length > 200) { toast.error('Up to 200 listings per file'); setRows(null); return }
    setRows(records.map(rec => ({ rec, ...validateRow(rec), state: 'pending' })))
  }

  async function createAll() {
    const valid = rows.filter(r => r.errors.length === 0)
    if (!valid.length) return
    if (!window.confirm(`Create ${valid.length} listing${valid.length === 1 ? '' : 's'} now? They go live immediately.`)) return
    setCreating(true)
    const out = []
    for (let i = 0; i < valid.length; i++) {
      const r = valid[i]
      setProgress(`Creating ${i + 1} of ${valid.length}: ${r.form.address}`)
      let geo = null, warn = null
      try {
        geo = await geocodeAddress({ address: r.form.address, city: r.form.city, state: 'NY', zip_code: r.form.zip_code })
      } catch (err) {
        warn = `Address not placed on the map (${err.message}). Open the listing and fix the address.`
      }
      const { data, error } = await supabase.from('listings').insert(rowToInsert(r, user.id, geo, null)).select('id').single()
      if (error) {
        out.push({ address: r.form.address, ok: false, message: isDuplicateAddressError(error) ? DUPLICATE_ADDRESS_MESSAGE : error.message })
      } else {
        out.push({ address: r.form.address, ok: true, id: data.id, message: warn })
      }
    }
    setCreating(false)
    setProgress('')
    setResults(out)
    const made = out.filter(o => o.ok).length
    toast[made ? 'success' : 'error'](`${made} of ${valid.length} created`)
  }

  const validCount = (rows || []).filter(r => r.errors.length === 0).length

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
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, margin: 0 }}>Bulk upload</h1>
          <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>Post many listings from a spreadsheet</div>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {!profile?.verified && (
          <div className="card" style={{ padding: '16px 18px', background: 'rgba(196,113,74,0.06)', border: '1px solid rgba(196,113,74,0.25)', fontSize: '13px' }}>
            Your account is still being verified. You can prepare a file now; listings can be created once you are verified.
          </div>
        )}

        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 6px' }}>1. Download the template</h2>
          <p style={{ fontSize: '13px', color: 'var(--warm-gray)', lineHeight: 1.5, margin: '0 0 12px' }}>
            One row per listing. The second row explains each column; delete it or leave it, it is ignored. Photos are links to images you already host (at least 3). Every fee column must be filled in for a rental, 0 when there is none: the FARE Act requires every cost to be disclosed.
          </p>
          <button className="btn-secondary" onClick={downloadTemplate} style={{ padding: '10px 18px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Download size={15} /> cuna-listings-template.csv
          </button>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 6px' }}>2. Upload your file</h2>
          <p style={{ fontSize: '13px', color: 'var(--warm-gray)', lineHeight: 1.5, margin: '0 0 12px' }}>
            Nothing is created yet: you get a row-by-row check first.
          </p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} style={{ display: 'none' }} />
          <button className="btn-primary" onClick={() => fileRef.current?.click()} style={{ padding: '10px 18px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={15} /> {fileName ? 'Choose another file' : 'Choose a CSV file'}
          </button>
          {fileName && <div style={{ fontSize: '12px', color: 'var(--warm-gray)', marginTop: '8px' }}>{fileName}</div>}
        </div>

        {rows && (
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 6px' }}>3. Check the rows</h2>
            <p style={{ fontSize: '13px', color: 'var(--warm-gray)', lineHeight: 1.5, margin: '0 0 12px' }}>
              {validCount} of {rows.length} row{rows.length === 1 ? '' : 's'} ready. Rows with problems are skipped; fix them in the file and upload again.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rows.map((r, i) => (
                <div key={i} style={{
                  padding: '10px 12px', borderRadius: '10px', fontSize: '13px',
                  background: r.errors.length ? 'rgba(224,85,85,0.08)' : 'rgba(76,175,125,0.1)',
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {r.errors.length ? <AlertTriangle size={14} color="var(--pass-red)" /> : <Check size={14} color="var(--like-green)" />}
                    <span style={{ fontWeight: 600 }}>Row {r.rec._line}</span>
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.form.address || '(no address)'}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--warm-gray)', whiteSpace: 'nowrap' }}>{r.form.price ? `$${Number(r.form.price).toLocaleString()}` : ''}{r.form.listing_type === 'sale' ? '' : '/mo'}</span>
                  </div>
                  {r.errors.length > 0 && (
                    <ul style={{ margin: '6px 0 0 22px', padding: 0, color: 'var(--charcoal-soft)', lineHeight: 1.5 }}>
                      {r.errors.map((e, j) => <li key={j}>{e}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            {!results && (
              <button className="btn-primary w-full" onClick={createAll} disabled={creating || validCount === 0 || !profile?.verified}
                style={{ marginTop: '16px', opacity: creating || validCount === 0 || !profile?.verified ? 0.6 : 1 }}>
                {creating ? progress : `Create ${validCount} listing${validCount === 1 ? '' : 's'}`}
              </button>
            )}
          </div>
        )}

        {results && (
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 10px' }}>Done</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.map((o, i) => (
                <div key={i} style={{ fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  {o.ok ? <Check size={14} color="var(--like-green)" style={{ marginTop: '2px' }} /> : <AlertTriangle size={14} color="var(--pass-red)" style={{ marginTop: '2px' }} />}
                  <div>
                    {o.ok ? <button type="button" onClick={() => navigate('/listing/' + o.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 600, color: 'var(--terracotta)', fontSize: '13px' }}>{o.address}</button> : <strong>{o.address}</strong>}
                    {o.message && <div style={{ color: 'var(--charcoal-soft)' }}>{o.message}</div>}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-secondary w-full" onClick={() => navigate('/dashboard')} style={{ marginTop: '16px' }}>Back to my listings</button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
