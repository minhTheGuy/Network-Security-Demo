import {
  type SessionOptions,
  getIronSession,
  type IronSessionData,
} from 'iron-session'
import { cookies } from 'next/headers'

const sessionOptions: SessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD ?? '',
  cookieName: process.env.SESSION_COOKIE_NAME ?? 'myapp-webauthn',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}

declare module 'iron-session' {
  interface IronSessionData {
    userId?: string;
    challenge?: string;
  }
}

type NextCookiesInstance = Awaited<ReturnType<typeof cookies>>

type IronSessionCookieStore = {
  get: (name: string) => { name: string; value: string } | undefined
  set: NextCookiesInstance['set']
}

const getServerActionSession = async () => {
  const cookieStore = await cookies()
  const store: IronSessionCookieStore = {
    get: (name: string) => {
      const cookie = cookieStore.get(name)
      return cookie ? { name: cookie.name, value: cookie.value } : undefined
    },
    set: cookieStore.set.bind(cookieStore),
  }

  return getIronSession<IronSessionData>(store, sessionOptions)
}

export default getServerActionSession

