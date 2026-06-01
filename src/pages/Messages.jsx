import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ChevronLeft, Send } from 'lucide-react'

export default function Messages() {
  const { matchId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [match, setMatch] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchMatch()
    fetchMessages()

    const sub = supabase
      .channel(`messages:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [matchId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMatch() {
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        listings(address, city, price, bedrooms, photos),
        renter:profiles!matches_renter_id_fkey(name),
        poster:profiles!matches_poster_id_fkey(name)
      `)
      .eq('id', matchId)
      .single()
    setMatch(data)
    setLoading(false)
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('sent_at', { ascending: true })
    setMessages(data || [])

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('match_id', matchId)
      .neq('sender_id', user.id)
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim()) return
    const content = text.trim()
    setText('')

    await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: user.id,
      content,
    })
  }

  if (loading) return <div className="center" style={{ height: '100dvh' }}><div className="spinner" /></div>

  const listing = match?.listings
  const otherName = user.id === match?.renter_id ? match?.poster?.name : match?.renter?.name

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--sand)' }}>
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--sand-dark)',
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px',
        flexShrink: 0,
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', display: 'flex' }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>{otherName}</div>
          <div style={{ fontSize: '12px', color: 'var(--warm-gray)' }}>
            {listing?.address} · ${listing?.price?.toLocaleString()}/mo
          </div>
        </div>
        {listing?.photos?.[0] && (
          <img src={listing.photos[0]} alt="" style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }} />
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--warm-gray)', fontSize: '14px' }}>
            Start the conversation 👋
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === user.id
          return (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: isMe ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '75%',
                padding: '10px 14px',
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMe ? 'var(--terracotta)' : 'var(--white)',
                color: isMe ? 'white' : 'var(--charcoal)',
                fontSize: '14px', lineHeight: 1.45,
                boxShadow: 'var(--shadow-sm)',
              }}>
                {msg.content}
                <div style={{
                  fontSize: '10px', marginTop: '4px', opacity: 0.6,
                  textAlign: isMe ? 'right' : 'left',
                }}>
                  {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={sendMessage}
        style={{
          padding: '12px 16px max(12px, env(safe-area-inset-bottom))',
          background: 'var(--white)', borderTop: '1px solid var(--sand-dark)',
          display: 'flex', gap: '10px', alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Message..."
          style={{ flex: 1, borderRadius: '24px', padding: '10px 16px' }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) } }}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          style={{
            width: '42px', height: '42px', borderRadius: '50%',
            background: text.trim() ? 'var(--terracotta)' : 'var(--warm-gray-light)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: text.trim() ? 'pointer' : 'default', transition: 'background 0.2s', flexShrink: 0,
          }}
        >
          <Send size={18} color="white" />
        </button>
      </form>
    </div>
  )
}