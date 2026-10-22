// Signed, sign-in-free unsubscribe token: base64url(userId) + '.' + HMAC.
// A leading underscore keeps Vercel from exposing this file as a route.
import { createHmac, timingSafeEqual } from 'crypto'

const b64url = (s) => Buffer.from(s, 'utf8').toString('base64url')

export function unsubscribeToken(userId, secret) {
  const body = b64url(userId)
  const sig = createHmac('sha256', secret).update(body).digest('base64url')
  return body + '.' + sig
}

export function verifyUnsubscribeToken(token, secret) {
  if (typeof token !== 'string' || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expected = createHmac('sha256', secret).update(body).digest('base64url')
  const a = Buffer.from(sig || ''), b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  const userId = Buffer.from(body, 'base64url').toString('utf8')
  return /^[0-9a-f-]{36}$/.test(userId) ? userId : null
}
