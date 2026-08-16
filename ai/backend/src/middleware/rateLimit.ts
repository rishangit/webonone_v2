export type RateLimiter = {
  allow: (key: string) => boolean
}

export function createMemoryRateLimiter(options: { max: number; windowMs: number }): RateLimiter {
  const hits = new Map<string, { count: number; resetAt: number }>()

  return {
    allow(key: string) {
      const now = Date.now()
      const entry = hits.get(key)
      if (!entry || entry.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + options.windowMs })
        return true
      }
      if (entry.count >= options.max) {
        return false
      }
      entry.count += 1
      return true
    },
  }
}

export function clientIp(req: { ip?: string; socket?: { remoteAddress?: string }; headers: Record<string, unknown> }) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]!.trim()
  }
  return req.ip || req.socket?.remoteAddress || 'unknown'
}
