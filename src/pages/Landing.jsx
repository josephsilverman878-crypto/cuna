import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(160deg, #F5F0E8 0%, #EDE6D6 50%, #E0D4C4 100%)',
    }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px 40px',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 600, color: 'var(--terracotta)' }}>
          cuna
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-ghost" onClick={() => navigate('/login')}>Sign in</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Get started</button>
        </div>
      </nav>

      {/* Hero */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', textAlign: 'center',
      }}>
        <div style={{
          fontSize: '13px', fontWeight: 500, letterSpacing: '2px',
          textTransform: 'uppercase', color: 'var(--terracotta)',
          marginBottom: '24px',
        }}>
          Property discovery, reimagined
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 8vw, 96px)',
          fontWeight: 500,
          lineHeight: 1.05,
          color: 'var(--charcoal)',
          marginBottom: '24px',
          maxWidth: '800px',
        }}>
          Find the space<br />where you belong
        </h1>

        <p style={{
          fontSize: '18px', color: 'var(--warm-gray)',
          maxWidth: '480px', lineHeight: 1.6, marginBottom: '48px',
          fontWeight: 300,
        }}>
          Cuna helps people and businesses find the spaces where they belong — making property discovery fast, efficient, and effortless.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            className="btn-primary"
            style={{ fontSize: '17px', padding: '16px 40px' }}
            onClick={() => navigate('/register')}
          >
            Find your space
          </button>
          <button
            className="btn-secondary"
            style={{ fontSize: '17px', padding: '16px 40px' }}
            onClick={() => navigate('/register/pro')}
          >
            List a property
          </button>
        </div>

        {/* Cards preview */}
        <div style={{
          marginTop: '80px',
          display: 'flex', gap: '16px', justifyContent: 'center',
          perspective: '1000px',
        }}>
          {[
            { price: '$3,200', beds: '2 bed', area: 'Park Slope, BK', emoji: '🏙️' },
            { price: '$4,450', beds: '3 bed', area: 'Carroll Gardens', emoji: '🌿', front: true },
            { price: '$2,800', beds: '1 bed', area: 'Astoria, Queens', emoji: '🌆' },
          ].map((apt, i) => (
            <div key={i} style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius)',
              padding: '20px',
              width: '160px',
              boxShadow: apt.front ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
              transform: apt.front ? 'translateY(-12px) scale(1.05)' : `rotate(${i === 0 ? -4 : 4}deg)`,
              opacity: apt.front ? 1 : 0.7,
              transition: 'all 0.3s ease',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', textAlign: 'center' }}>{apt.emoji}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, color: 'var(--terracotta)' }}>{apt.price}</div>
              <div style={{ fontSize: '13px', color: 'var(--charcoal)', fontWeight: 500, marginTop: '4px' }}>{apt.beds}</div>
              <div style={{ fontSize: '12px', color: 'var(--warm-gray)', marginTop: '2px' }}>{apt.area}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '24px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid var(--sand-dark)',
        fontSize: '13px', color: 'var(--warm-gray)',
      }}>
        <div>© 2026 Cuna</div>
        <div>Cuna helps people and businesses find the spaces where they belong</div>
      </footer>
    </div>
  )
}
