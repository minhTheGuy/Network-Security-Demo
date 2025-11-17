import crypto from 'crypto'

/**
 * Make a string url-safe by replacing base64 special chars.
 */
export function clean(str: string) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Generate a random challenge suitable for WebAuthn.
 */
export async function generateChallenge(): Promise<string> {
  return clean(crypto.randomBytes(32).toString('base64'))
}

/**
 * Convert a binary buffer to base64url encoded string.
 */
export function binaryToBase64url(bytes: ArrayBuffer | Uint8Array) {
  const buffer = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return Buffer.from(buffer).toString('base64url')
}

