import { useEffect, useState } from 'react'

/** Probe whether an origin responds to a simple GET. Pass `retryKey` to re-probe. */
export function useOriginReachable(origin: string, retryKey = 0): boolean | null {
  const [reachable, setReachable] = useState<boolean | null>(null)

  useEffect(() => {
    if (!origin) {
      setReachable(false)
      return
    }

    let cancelled = false

    async function probe() {
      try {
        const response = await fetch(`${origin}/`, { method: 'GET' })
        if (!cancelled) {
          setReachable(response.ok)
        }
      } catch {
        if (!cancelled) {
          setReachable(false)
        }
      }
    }

    void probe()

    return () => {
      cancelled = true
    }
  }, [origin, retryKey])

  return reachable
}

export function normalizeOrigin(raw: string): string {
  try {
    return new URL(raw.replace(/\/$/, '')).origin
  } catch {
    return ''
  }
}
