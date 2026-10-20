import { supabase } from './supabase'
import { STORAGE_KEY } from './quizQuestions'

// Where the in-progress quiz lives between page loads.
//
// WHY THIS FILE EXISTS. localStorage is keyed by ORIGIN, not by account, and
// nothing used to clear it on sign-out. "Use your saved answers" pulls answers
// out of the signed-in renter's ACCOUNT and writes them here, so on a shared
// browser the next person to sign in was offered the previous person's budget,
// bedroom count, move-in timeline and neighbourhood priorities. Observed, not
// theorised: 05-followups.md item 12.
//
// THE RULE. Every stored draft records who it belongs to:
//   - a real user id  -> readable ONLY by that user
//   - 'anon'          -> readable by anyone using this browser
//
// An anonymous draft is just what somebody typed into this browser before
// signing in. It is not account data, and it has to stay readable across a
// sign-in, because that is exactly the "Save my results" -> /login -> save
// round trip. Only a draft that came from, or was written while inside, an
// account is fenced off.
//
// Every localStorage touch stays wrapped: Safari private mode and blocked-
// cookie settings throw on access, and the quiz has to keep working without it.

const ANON_OWNER = 'anon'

// The owner to read or write as. Callers MUST wait until auth has resolved
// before using this -- during AuthContext's initial load `user` is null even
// for a signed-in visitor, and treating that as 'anon' would hide a user's
// own draft from them.
export function quizOwnerId(user) {
  return user?.id || ANON_OWNER
}

export function loadQuizDraft(ownerId) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.answers) return null
    // Drafts written before this change carry no owner. Treat them as
    // anonymous: they predate any account ever being read into storage.
    const owner = parsed.owner || ANON_OWNER
    if (owner !== ANON_OWNER && owner !== ownerId) return null
    return parsed
  } catch {
    return null
  }
}

export function saveQuizDraft(ownerId, answers, step) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      owner: ownerId,
      savedAt: new Date().toISOString(),
      step,
      answers,
    }))
  } catch {
    // Storage unavailable — the quiz still runs, it just won't resume later.
  }
}

export function clearQuizDraft() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to do; in-memory state is still correct.
  }
}

// Clear on sign-out. This is belt-and-braces: the owner check above already
// hides one account's draft from another. It is here because the check is only
// as good as the id it compares against, and a signed-out browser has no id to
// compare. Registered on the auth event rather than inside signOut() so it also
// fires when a session simply ends -- expiry, or a sign-out in another tab.
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') clearQuizDraft()
})
