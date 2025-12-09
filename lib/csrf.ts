/**
 * CSRF Protection utilities
 */

'use server'

import crypto from 'crypto'
import { cookies } from 'next/headers'
import { generateCsrfToken } from '@lib/csrf-utils'

const CSRF_TOKEN_COOKIE = 'csrf-token'
const CSRF_TOKEN_HEADER = 'x-csrf-token'

/**
 * Get or create CSRF token for current session
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies()
  const existingToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value

  if (existingToken) {
    return existingToken
  }

  // Generate new token
  const newToken = generateCsrfToken()
  cookieStore.set(CSRF_TOKEN_COOKIE, newToken, {
    httpOnly: false, // CSRF token cần accessible từ JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })

  return newToken
}

/**
 * Verify CSRF token from request
 */
export async function verifyCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value

  if (!cookieToken) {
    return false
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER)

  if (!headerToken) {
    return false
  }

  // Compare tokens using constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  )
}

/**
 * Clear CSRF token (on logout)
 */
export async function clearCsrfToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CSRF_TOKEN_COOKIE)
}

