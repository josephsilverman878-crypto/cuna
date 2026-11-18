import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronDown, Mail } from 'lucide-react'
import { CONTACT, SECTIONS } from '../lib/helpContent.js'

// /help — plain-language answers for renters, buyers and posters, and the
// one address to write to. Static: nothing here reads the database.

export default function Help() {
  const navigate = useNavigate()
  const [open, setOpen] = useState({})
  const toggle = (k) => setOpen(o => ({ ...o, [k]: !o[k] }))

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '60px' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)', padding: '16px 24px',
        position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex' }}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, margin: 0 }}>Help</h1>
          <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>Answers for renters, buyers and posters</div>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div className="card" style={{ padding: '18px 20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Mail size={18} color="var(--terracotta)" />
          <div style={{ flex: 1, minWidth: '200px', fontSize: '14px', lineHeight: 1.5 }}>
            Can’t find it here? Write to <a href={`mailto:${CONTACT}`} style={{ color: 'var(--terracotta)', fontWeight: 600 }}>{CONTACT}</a>. A person reads every message.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SECTIONS.map(s => (
            <a key={s.id} href={'#' + s.id} style={{
              padding: '7px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, textDecoration: 'none',
              background: 'var(--white)', color: 'var(--charcoal-soft)', border: '1px solid var(--sand-dark)',
            }}>{s.title}</a>
          ))}
        </div>

        {SECTIONS.map(s => (
          <div key={s.id} id={s.id} className="card" style={{ padding: '6px 20px 10px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '21px', margin: '14px 0 6px' }}>{s.title}</h2>
            {s.items.map(([q, a], i) => {
              const k = s.id + i
              return (
                <div key={k} style={{ borderTop: '1px solid var(--sand-dark)' }}>
                  <button type="button" onClick={() => toggle(k)} aria-expanded={Boolean(open[k])} style={{
                    width: '100%', background: 'none', border: 'none', padding: '12px 0', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
                    fontSize: '14px', fontWeight: 600, color: 'var(--charcoal)',
                  }}>
                    {q}
                    <ChevronDown size={16} color="var(--warm-gray)" style={{ transform: open[k] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                  </button>
                  {open[k] && <p style={{ margin: '0 0 12px', fontSize: '14px', lineHeight: 1.6, color: 'var(--charcoal-soft)' }}>{a}</p>}
                </div>
              )
            })}
          </div>
        ))}

        <p style={{ fontSize: '12px', color: 'var(--warm-gray)', textAlign: 'center', lineHeight: 1.6 }}>
          <Link to="/terms" style={{ color: 'var(--warm-gray)' }}>Terms of Service</Link> · <Link to="/privacy" style={{ color: 'var(--warm-gray)' }}>Privacy Policy</Link> · <Link to="/market" style={{ color: 'var(--warm-gray)' }}>Market data</Link> · <Link to="/neighborhoods" style={{ color: 'var(--warm-gray)' }}>Neighborhoods</Link>
        </p>
      </div>
    </div>
  )
}
