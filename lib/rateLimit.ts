import { Ratelimit, type Duration } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

// redis ping
redis
  .ping()
  .then((res) => {
    console.log(' Upstash Redis connected:', res)
  })
  .catch((err) => {
    console.error('Upstash Redis connection failed:', err)
  })

const createLimiter = (prefix: string, requests: number, window: Duration) =>
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix,
  })

const apiLimiter = createLimiter('api-auth', 10, '1 m')
const middlewareLimiter = createLimiter('middleware', 20, '1 m')

export const limitApiRoute = async (ip: string, routeKey: string) => {
  return apiLimiter.limit(`${routeKey}:${ip}`)
}

export const limitByIp = async (ip: string) => {
  return middlewareLimiter.limit(ip)
}

export const getClientIp = (headers: Headers, fallback = 'unknown') => {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const [first] = forwarded.split(',')
    if (first?.trim()) {
      return first.trim()
    }
  }
  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  return fallback
}