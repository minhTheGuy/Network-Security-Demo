/**
 * CSRF token generation utilities (pure functions, no server actions)
 */

import crypto from 'crypto'

const CSRF_TOKEN_LENGTH = 32

/**
 * Generate a random CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

