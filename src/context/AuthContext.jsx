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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // This lands in auth.users.raw_user_meta_data and is the ONLY input to
        // handle_new_user(), the trigger on auth.users that now writes the
        // profiles row. Change a key name here and the trigger stops seeing
        // that field: name and phone go missing and it declines to create the
        // row at all, sending the user to CompleteProfile instead.
        //
        // Attacker-controlled by definition -- anyone can call signUp with any
        // options.data. is_admin and verified are deliberately absent, and the
        // trigger never reads them from here even if a caller adds them.
        //
        // GoTrue also injects email, email_verified, phone_verified and sub
        // into the same object, so the trigger takes the email and the id from
        // auth.users itself, not from here.
        //
        // This also lands in the user's own JWT as user_metadata, so it holds
        // only what they typed about themselves.
        data: {
          role,
          name,
          phone,
          accepted_terms_at: accepted_terms_at || new Date().toISOString(),
          license_name: license_name || null,
          license_number: license_number || null,
          license_type: license_type || null,
          brokerage_name: brokerage_name || null,
        },
      },
    })
    if (error) throw error

    // No profiles write here. handle_new_user() on auth.users creates the row
    // -- and renter_profiles for renters -- inside the signup transaction,
    // from the metadata above, so it already exists by the time signUp
    // resolves. Verified on production 2026-10-13: the trigger-written row's
    // created_at matched the auth.users row to within 2ms, where the previous
    // client-written one lagged by 931ms.
    //
    // The write was removed rather than kept as a harmless upsert: with the
    // trigger owning the row, an upsert is an UPDATE, and sending a `role`
    // that differs from the one the trigger derived is rejected by
    // guard_profile_privileges ("role cannot be changed once set"). Deleting
    // the second writer removes the failure mode instead of coordinating it.
    //
    // If the row is somehow absent, `user && !profile` routes to
    // CompleteProfile (src/main.jsx:41) -- the same safety net as before.
    if (data.user) await fetchProfile(data.user.id)
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
