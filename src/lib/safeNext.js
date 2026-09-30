// Validates a `?next=` redirect target before we navigate to it.
//
// An unvalidated `next` is an open redirect: a link like
// /login?next=https://example.com or /login?next=//example.com would bounce a
// user straight off Cuna after they sign in, which is a credible phishing setup.
// Only a same-site absolute path is allowed through.
export function safeNextPath(value, fallback = '/') {
  if (typeof value !== 'string') return fallback

  const path = value.trim()
  if (!path.startsWith('/')) return fallback

  // "//host" is protocol-relative, and browsers treat "/\host" the same way.
  // Both leave the site despite the leading slash.
  if (path[1] === '/' || path[1] === '\\') return fallback

  // Control characters can be used to smuggle a second target past parsers.
  if (/[\u0000-\u001f\u007f]/.test(path)) return fallback

  return path
}
