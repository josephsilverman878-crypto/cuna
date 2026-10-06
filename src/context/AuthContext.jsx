import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    setProfile(data)
    setLoading(false)
  }

  async function signUp({ email, password, name, phone, role, accepted_terms_at, license_name, license_number, license_type, brokerage_name }) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      // upsert, not insert. Stage 2b-trigger adds handle_new_user on auth.users,
      // which creates this row server-side; an insert would then hit a duplicate
      // key, throw, and break signup. upsert works both before and after that
      // trigger exists, so the two changes can ship separately.
      //
      // `role` is still sent here because no trigger owns it yet. The change
      // that adds handle_new_user must REMOVE role from this payload: once the
      // trigger writes it, this upsert becomes an UPDATE, and sending a role
      // that differs from the trigger's is rejected by the profiles guard
      // ("role cannot be changed once set").
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        email,
        phone,
        role,
        accepted_terms_at: accepted_terms_at || new Date().toISOString(),
        license_name: license_name || null,
        license_number: license_number || null,
        license_type: license_type || null,
        brokerage_name: brokerage_name || null,
      })
      if (profileError) throw profileError
      if (role === 'renter') {
        // Also upsert: handle_new_user will create this row too, and a duplicate
        // must not surface as an error. Kept non-fatal on purpose — a missing
        // renter_profiles row is recoverable, a failed signup is not.
        const { error: renterError } = await supabase
          .from('renter_profiles')
          .upsert({ id: data.user.id }, { onConflict: 'id' })
        if (renterError) console.error('Renter profile creation failed:', renterError)
      }
      await fetchProfile(data.user.id)
    }
    return data
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
