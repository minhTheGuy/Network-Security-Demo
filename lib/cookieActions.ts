'use server'

import getServerActionSession from '@lib/session'
import { storeChallenge, consumeChallenge } from '@lib/challenge-store'
import { clearCsrfToken } from '@lib/csrf'

type UserIdentifier = {
  id?: string | number;
  _id?: string | number;
}

const normalizeUserId = (user: UserIdentifier | string): string => {
  if (typeof user === 'string') {
    return user
  }
  if (user.id != null) {
    return String(user.id)
  }
  if (user._id != null) {
    return String(user._id)
  }
  throw new Error('Cannot determine user id for session storage')
}

export const authenticatedUserIdToCookieStorage = async (
  user: UserIdentifier | string,
) => {
  const session = await getServerActionSession()
  const oldUserId = session.userId
  const newUserId = normalizeUserId(user)
  
  // Session rotation: Regenerate session on login (when user changes or first time)
  if (oldUserId !== newUserId || !oldUserId) {
    // Destroy old session to force regeneration
    await session.destroy()
    
    // Get new session (will create new session ID)
    const newSession = await getServerActionSession()
    newSession.userId = newUserId
    await newSession.save()
  } else {
    // Same user, just update
    session.userId = newUserId
    await session.save()
  }
}

export const getRegisteredUserIdFromCookieStorage = async () => {
  try {
    const session = await getServerActionSession()
    return session.userId
  } catch (error) {
    console.error('Error getting user ID from session:', error)
    return undefined
  }
}

export const setChallengeToCookieStorage = async (challenge: string, userId?: string) => {
  const session = await getServerActionSession()
  session.challenge = challenge
  await session.save()
  
  // Store challenge in database for one-time use validation
  await storeChallenge(challenge, userId, 300) // 5 minutes TTL
}

export const consumeChallengeFromCookieStorage = async (): Promise<string | null> => {
  const session = await getServerActionSession()
  const { challenge } = session
  
  if (!challenge) {
    return null
  }
  
  // Verify challenge hasn't been used before (one-time use)
  const isValid = await consumeChallenge(challenge)
  if (!isValid) {
    return null // Challenge đã được sử dụng hoặc không hợp lệ
  }
  
  session.challenge = undefined
  await session.save()
  return challenge
}

export const clearCookies = async () => {
  const session = await getServerActionSession()
  await session.destroy()
  await clearCsrfToken()
}

