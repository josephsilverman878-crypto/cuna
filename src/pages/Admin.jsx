import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import toast from 'react-hot-toast'
import { ChevronLeft, Check, ExternalLink } from 'lucide-react'

export default function Admin() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [posters, setPosters] = useState([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(null)
  const [tab, setTab] = useState('pending')

  useEffect(() => { if (profile?.is_admin) fetchPosters() }, [profile, tab])

  async function fetchPosters() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'poster')
      .eq('verified', tab === 'verified')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Admin fetch error:', error)
      toast.error('Could not load posters')
    }
    setPosters(data || [])
    setLoading(false)
  }

  async function approve(poster) {
    setApproving(poster.id)
    const { error } = await supabase
      .from('profiles')
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq('id', poster.id)
    if (error) {
      console.error('Approve error:', error)
      toast.error(error.message || 'Could not approve')
    } else {
      toast.success(poster.name + ' verified')
      setPosters(prev => prev.filter(p => p.id !== poster.id))
    }
    setApproving(null)
  }

  async function revoke(poster) {
    if (!window.confirm('Revoke verification for ' + poster.name + '?')) return
    setApproving(poster.id)
    const { error } = await supabase
      .from('profiles')
      .update({ verified: false, verified_at: null })
      .eq('id', poster.id)
    if (error) {
      toast.error(error.message || 'Could not revoke')
    } else {
      toast.success('Verification revoked')
      setPosters(prev => prev.filter(p => p.id !== poster.id))
    }
    setApproving(null)
  }

  if (!profile?.is_admin) {
    return (
      <div className="center" style={{ height: '100dvh', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'var(--warm-gray)' }}>Not authorized.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Go home</button>
      </div>
    )
  }

  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', gap: '12px', fontSize: '13px', padding: '4px 0' }}>
      <span style={{ color: 'var(--warm-gray)', minWidth: '110px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value || '—'}</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--sand)', paddingBottom: '100px' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)',
        padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <button onClick={() => navigate('/')} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex',
        }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600 }}>
          Agent verification
        </h1>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setTab('pending')}
            style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
              background: tab === 'pending' ? 'var(--terracotta)' : 'var(--white)',
              color: tab === 'pending' ? 'white' : 'var(--warm-gray)',
              border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
            }}
          >
            Pending
          </button>
          <button
            onClick={() => setTab('verified')}
            style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
              background: tab === 'verified' ? 'var(--terracotta)' : 'var(--white)',
              color: tab === 'verified' ? 'white' : 'var(--warm-gray)',
              border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
            }}
          >
            Verified
          </button>
        </div>

        <button
          onClick={() => window.open('https://dos.ny.gov/licensing/eaccessny.html', '_blank')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px',
            fontSize: '13px', fontWeight: 600, color: 'var(--terracotta)',
          }}
        >
          Open NY DOS license search
          <ExternalLink size={13} />
        </button>

        {loading ? (
          <div className="center" style={{ padding: '40px' }}><div className="spinner" /></div>
        ) : posters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--warm-gray)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>
              {tab === 'pending' ? '✅' : '📋'}
            </div>
            <p style={{ fontSize: '14px' }}>
              {tab === 'pending' ? 'No posters waiting for review.' : 'No verified posters yet.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posters.map(p => (
              <div key={p.id} className="card" style={{ padding: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '16px' }}>{p.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--terracotta)' }}>{p.email}</div>
                </div>

                <div style={{ borderTop: '1px solid var(--sand-dark)', paddingTop: '12px', marginBottom: '16px' }}>
                  <Row label="Phone" value={p.phone} />
                  <Row label="Licensed name" value={p.license_name} />
                  <Row label="License no." value={p.license_number} />
                  <Row label="License type" value={p.license_type} />
                  <Row label="Brokerage" value={p.brokerage_name} />
                  <Row label="Signed up" value={p.created_at ? new Date(p.created_at).toLocaleDateString() : null} />
                </div>

                {tab === 'pending' ? (
                  <button
                    className="btn-primary w-full"
                    onClick={() => approve(p)}
                    disabled={approving === p.id}
                    style={{
                      opacity: approving === p.id ? 0.7 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    <Check size={16} />
                    {approving === p.id ? 'Approving...' : 'Approve agent'}
                  </button>
                ) : (
                  <button
                    onClick={() => revoke(p)}
                    disabled={approving === p.id}
                    style={{
                      width: '100%', padding: '12px', background: 'rgba(229,62,62,0.12)',
                      border: 'none', borderRadius: '12px', cursor: 'pointer',
                      fontWeight: 600, fontSize: '13px', color: '#e53e3e',
                    }}
                  >
                    {approving === p.id ? 'Working...' : 'Revoke verification'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
