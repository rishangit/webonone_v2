/** Sparse call_order spacing so late inserts can use midpoints. */
export const CALL_ORDER_STEP = 1000

/** Used when the session has no completion pace yet. */
export const DEFAULT_AVG_SERVICE_MS = 5 * 60 * 1000

export function callOrderFromTokenNumber(tokenNumber: number): number {
  return tokenNumber * CALL_ORDER_STEP
}

export type LateQueueWaiter = {
  id: string
  callOrder: number
  checkedInAtMs: number
}

export type CompletedPaceSample = {
  updatedAtMs: number
}

/**
 * Pick insertion index into the checked-in waiting line (0 = front / next after serving)
 * that minimizes variance of projected total waits. Tie-break: larger index (farther back).
 */
export function pickEqualWaitInsertIndex(
  waiters: LateQueueWaiter[],
  nowMs: number,
  avgServiceMs: number,
): number {
  const pace = Math.max(1, avgServiceMs)
  let bestIndex = waiters.length
  let bestScore = Number.POSITIVE_INFINITY

  for (let i = 0; i <= waiters.length; i++) {
    const totals: number[] = [i * pace]
    for (let j = 0; j < waiters.length; j++) {
      const waiter = waiters[j]!
      const newPos = j < i ? j : j + 1
      const elapsed = Math.max(0, nowMs - waiter.checkedInAtMs)
      totals.push(elapsed + newPos * pace)
    }
    const mean = totals.reduce((sum, value) => sum + value, 0) / totals.length
    const variance = totals.reduce((sum, value) => {
      const delta = value - mean
      return sum + delta * delta
    }, 0)

    if (variance < bestScore || (variance === bestScore && i > bestIndex)) {
      bestScore = variance
      bestIndex = i
    }
  }

  return bestIndex
}

export function estimateAvgServiceMs(options: {
  completed: CompletedPaceSample[]
  startedAtMs: number | null
  nowMs: number
}): number {
  const completed = options.completed
    .slice()
    .sort((a, b) => a.updatedAtMs - b.updatedAtMs)

  if (completed.length >= 2) {
    let gapSum = 0
    let gapCount = 0
    for (let i = 1; i < completed.length; i++) {
      const gap = completed[i]!.updatedAtMs - completed[i - 1]!.updatedAtMs
      if (gap > 0) {
        gapSum += gap
        gapCount += 1
      }
    }
    if (gapCount > 0) return gapSum / gapCount
  }

  if (options.startedAtMs != null && completed.length >= 1) {
    const elapsed = options.nowMs - options.startedAtMs
    if (elapsed > 0) return elapsed / completed.length
  }

  return DEFAULT_AVG_SERVICE_MS
}

/** Call order to place a late token at insert index among waiters (serving not in list). */
export function resolveInsertCallOrder(options: {
  insertIndex: number
  waiters: LateQueueWaiter[]
  servingCallOrder: number | null
}): { callOrder: number; needsRenumber: boolean } {
  const { insertIndex, waiters, servingCallOrder } = options

  if (waiters.length === 0) {
    const base = servingCallOrder != null ? servingCallOrder + CALL_ORDER_STEP : CALL_ORDER_STEP
    return { callOrder: base, needsRenumber: false }
  }

  if (insertIndex <= 0) {
    const first = waiters[0]!.callOrder
    const lower = servingCallOrder != null ? servingCallOrder : first - CALL_ORDER_STEP * 2
    if (first - lower >= 2) {
      return { callOrder: Math.floor((lower + first) / 2), needsRenumber: false }
    }
    return { callOrder: 0, needsRenumber: true }
  }

  if (insertIndex >= waiters.length) {
    const last = waiters[waiters.length - 1]!.callOrder
    return { callOrder: last + CALL_ORDER_STEP, needsRenumber: false }
  }

  const before = waiters[insertIndex - 1]!.callOrder
  const after = waiters[insertIndex]!.callOrder
  if (after - before >= 2) {
    return { callOrder: Math.floor((before + after) / 2), needsRenumber: false }
  }
  return { callOrder: 0, needsRenumber: true }
}

/** Renumber serving (optional) then waiters in order with late inserted at insertIndex. */
export function buildRenumberedCallOrders(options: {
  servingId: string | null
  servingCallOrder: number | null
  waiters: LateQueueWaiter[]
  lateTokenId: string
  insertIndex: number
}): Array<{ id: string; callOrder: number }> {
  const orderedIds: string[] = []
  if (options.servingId) orderedIds.push(options.servingId)

  for (let j = 0; j < options.waiters.length; j++) {
    if (j === options.insertIndex) orderedIds.push(options.lateTokenId)
    orderedIds.push(options.waiters[j]!.id)
  }
  if (options.insertIndex >= options.waiters.length) {
    orderedIds.push(options.lateTokenId)
  }

  const base =
    options.servingCallOrder != null && options.servingId
      ? Math.max(CALL_ORDER_STEP, options.servingCallOrder)
      : CALL_ORDER_STEP

  return orderedIds.map((id, index) => ({
    id,
    callOrder: base + index * CALL_ORDER_STEP,
  }))
}

export function toCheckedInAtMs(value: Date | string): number {
  if (value instanceof Date) return value.getTime()
  const parsed = Date.parse(String(value))
  return Number.isFinite(parsed) ? parsed : Date.now()
}
