/**
 * Helper functions to get rpID and origin from request headers
 * Supports both localhost and ngrok
 */

export function getRpID(hostname?: string | null, origin?: string | null): string {
  // Nếu có environment variable, ưu tiên dùng nó
  if (process.env.WEBAUTHN_RP_ID) {
    return process.env.WEBAUTHN_RP_ID
  }

  let domain = ''

  // Try to get from origin first (more reliable for ngrok)
  if (origin) {
    try {
      const url = new URL(origin)
      domain = url.hostname
    } catch (e) {
      // Invalid URL, fall through
    }
  }

  // Fallback to hostname
  if (!domain && hostname) {
    // Remove port if present
    domain = hostname.split(':')[0]
  }

  // Default to localhost
  if (!domain) {
    return 'localhost'
  }

  return domain
}

export function getOrigin(origin?: string | null, hostname?: string | null): string {
  // Nếu có environment variable, ưu tiên dùng nó
  if (process.env.WEBAUTHN_ORIGIN) {
    return process.env.WEBAUTHN_ORIGIN
  }

  if (origin) {
    return origin
  }

  // Fallback: construct from hostname
  if (hostname) {
    const protocol = hostname.includes('localhost') ? 'http' : 'https'
    return `${protocol}://${hostname}`
  }

  // Default
  return 'http://localhost:3000'
}

