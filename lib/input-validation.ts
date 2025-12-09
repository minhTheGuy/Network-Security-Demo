/**
 * Input validation utilities
 */

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return false
  }
  
  // Length check
  if (email.length > 254) {
    return false
  }
  
  // Prevent email injection
  if (email.includes('\n') || email.includes('\r') || email.includes('\0')) {
    return false
  }
  
  return true
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function validateUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false
  }
  
  // Length check
  if (username.length > 100) {
    return false
  }
  
  // Prevent injection
  if (username.includes('\n') || username.includes('\r') || username.includes('\0')) {
    return false
  }
  
  return true
}

export function sanitizeUsername(username: string): string {
  return username.trim().slice(0, 100)
}

