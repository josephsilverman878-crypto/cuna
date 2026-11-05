import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import LeadInbox from '../components/LeadInbox'

// /leads: the poster's lead inbox on its own page (the dashboard shows the
// same list in its Requests tab).
export default function Leads() {
  const navigate = useNavigate()
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
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, margin: 0 }}>Leads</h1>
          <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>Tour requests and questions on your listings</div>
        </div>
      </div>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 24px' }}>
        <LeadInbox />
      </div>
      <BottomNav />
    </div>
  )
}
