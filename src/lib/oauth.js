import { supabase } from './supabase'

// Google and Apple sign-in through Supabase Auth (wave 5, item 5.5).
//
// OFF by default. VITE_OAUTH_PROVIDERS (a public flag, not a secret) lists
// the providers to show, e.g. "google" or "google,apple". It stays unset in
// production until the provider is configured in Supabase (see Needs
// Joseph NJ-6 / NJ-7 in docs/audit-build-progress.md); with it unset the
// buttons do not render at all.
//
// A new OAuth user has no profiles row (handle_new_user() reads signup
// metadata that an OAuth login does not carry), so src/main.jsx sends them
// to CompleteProfile, the same role + terms-acceptance gate as every other
// account. Nothing is written until they accept.

export const PROVIDERS = {
  google: { label: 'Continue with Google' },
  apple: { label: 'Continue with Apple' },
}

export function enabledProviders() {
  const raw = import.meta.env.VITE_OAUTH_PROVIDERS || ''
  return raw.split(',').map(s => s.trim().toLowerCase()).filter(p => PROVIDERS[p])
}

// `next` is where to land after the round trip; it is kept in the callback
// URL and re-validated by safeNextPath on return.
export async function signInWithProvider(provider, next = '/') {
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })
  if (error) throw error
}
