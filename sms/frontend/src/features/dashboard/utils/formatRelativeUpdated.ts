/** Relative “last updated” label for SMS credit balance (en-style). */
export function formatRelativeUpdated(
  iso: string | null | undefined,
  nowMs: number = Date.now(),
): string | null {
  if (!iso) return null
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return null
  const diffSec = Math.max(0, Math.floor((nowMs - then) / 1000))
  if (diffSec < 45) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`
  }
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) {
    return diffHr === 1 ? '1 hour ago' : `${diffHr} hours ago`
  }
  const diffDay = Math.floor(diffHr / 24)
  return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`
}

export type SmsCreditsViewState =
  | { kind: 'loading' }
  | { kind: 'not_configured' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; balance: number; lastUpdated: string | null }

/** Pure view-state helper for dashboard SMS credits card (testable). */
export function resolveSmsCreditsViewState(input: {
  status: 'idle' | 'loading' | 'error'
  balance: number | null
  configured: boolean | null
  lastUpdated: string | null
  error: string | null
  hasLoaded: boolean
}): SmsCreditsViewState {
  if (!input.hasLoaded && input.status === 'loading') {
    return { kind: 'loading' }
  }
  if (input.status === 'error' && input.error) {
    return { kind: 'error', message: input.error }
  }
  if (input.configured === false) {
    return { kind: 'not_configured' }
  }
  if (input.configured === true && input.balance != null) {
    return { kind: 'ready', balance: input.balance, lastUpdated: input.lastUpdated }
  }
  if (input.status === 'loading') {
    return { kind: 'loading' }
  }
  return { kind: 'loading' }
}
