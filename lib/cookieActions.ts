'use server'

import getServerActionSession from '@lib/session'

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
  session.userId = normalizeUserId(user)
  await session.save()
}

export const getRegisteredUserIdFromCookieStorage = async () => {
  const session = await getServerActionSession()
  return session.userId
}

export const setChallengeToCookieStorage = async (challenge: string) => {
  const session = await getServerActionSession()
  session.challenge = challenge
  await session.save()
}

export const consumeChallengeFromCookieStorage = async () => {
  const session = await getServerActionSession()
  const { challenge } = session
  session.challenge = undefined
  await session.save()
  return challenge
}

export const clearCookies = async () => {
  const session = await getServerActionSession()
  await session.destroy()
}

