import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(form)
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
      background: 'linear-gradient(160deg, #F5F0E8 0%, #EDE6D6 100%)',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 600, color: 'var(--terracotta)' }}>
            cuna
          </Link>
          <p style={{ marginTop: '8px', color: 'var(--warm-gray)', fontSize: '15px' }}>Welcome back</p>
        </div>

        <div className="card" style={{ padding: '36px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="label">Email</label>
              <input
                type="email" required placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password" required placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <button
              type="submit" className="btn-primary w-full"
              style={{ marginTop: '8px', opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--warm-gray)', fontSize: '14px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--terracotta)', fontWeight: 500 }}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}