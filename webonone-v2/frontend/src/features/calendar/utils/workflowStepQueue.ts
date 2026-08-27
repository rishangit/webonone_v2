import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'
import type { SessionRun, SessionToken } from '@/features/calendar/types/event.types'

export type SessionQueueLabels = {
  prevTokenLabel: string | null
  currentTokenLabel: string | null
  nextTokenLabel: string | null
}

export type WorkflowStepQueueSnapshot = SessionQueueLabels & {
  currentTokenId: string | null
  previousTokenId?: string | null
}

export function isWorkflowStepCompleted(
  progress: SessionToken['workflowProgress'] | undefined,
  itemId: string,
): boolean {
  if (!progress) return false
  if (progress.done) return true
  const index = progress.steps.findIndex((step) => step.id === itemId)
  if (index < 0) return false
  return progress.currentIndex > index
}

export function tokensAtWorkflowStep(
  tokens: SessionToken[],
  itemId: string,
  options?: {
    itemKind?: 'check_in' | 'space'
    checkedInUserIds?: Set<string>
  },
): SessionToken[] {
  return tokens
    .filter((token) => {
      if (token.workflowProgress?.done) return false
      const progress = token.workflowProgress
      if (!progress) return false

      if (options?.itemKind === 'check_in') {
        const checkInStep = progress.steps.find(
          (step) => step.id === itemId && step.kind === 'check_in',
        )
        if (!checkInStep) return false
        if (options.checkedInUserIds?.has(token.userId)) return true
        if (progress.currentIndex < 0) return true
        return progress.steps[progress.currentIndex]?.id === itemId
      }

      if (progress.currentIndex < 0) return false
      return progress.steps[progress.currentIndex]?.id === itemId
    })
    .slice()
    .sort((a, b) => a.tokenNumber - b.tokenNumber)
}

/** Session-wide Prev/Current/Next — mirrors backend computeSessionQueueLabels. */
export function computeSessionRunQueue(
  tokens: SessionToken[],
  run: SessionRun,
  checkedInUserIds?: Set<string>,
): SessionQueueLabels & { currentTokenId: string | null } {
  const current =
    tokens.find((token) => token.id === run.currentTokenId) ??
    tokens.find((token) => token.status === 'serving') ??
    null
  const prev = tokens
    .filter((token) => token.status === 'completed')
    .reduce<SessionToken | null>(
      (best, token) => (!best || token.tokenNumber > best.tokenNumber ? token : best),
      null,
    )
  const next = tokens
    .filter(
      (token) =>
        token.status === 'waiting' && (checkedInUserIds?.has(token.userId) ?? true),
    )
    .reduce<SessionToken | null>(
      (best, token) => (!best || token.tokenNumber < best.tokenNumber ? token : best),
      null,
    )
  return {
    prevTokenLabel: prev?.tokenLabel ?? null,
    currentTokenLabel: current?.tokenLabel ?? null,
    nextTokenLabel: next?.tokenLabel ?? null,
    currentTokenId: current?.id ?? null,
  }
}

export function computeWorkflowStepViewerQueue(
  tokens: SessionToken[],
  item: ServiceWorkflowItem,
  items: ServiceWorkflowItem[],
  checkedInUserIds?: Set<string>,
): WorkflowStepQueueSnapshot {
  const atStep = tokensAtWorkflowStep(tokens, item.id, {
    itemKind: item.kind,
    checkedInUserIds,
  })
  if (atStep.length === 0) {
    return {
      prevTokenLabel: null,
      currentTokenLabel: null,
      nextTokenLabel: null,
      currentTokenId: null,
      previousTokenId: null,
    }
  }
  const servingIdx = atStep.findIndex((token) => token.status === 'serving')
  const idx = servingIdx >= 0 ? servingIdx : 0
  const current = atStep[idx] ?? null
  const next = atStep[idx + 1] ?? null
  const previous = atStep[idx - 1] ?? null
  const itemIndex = items.findIndex((entry) => entry.id === item.id)
  const nextItem = itemIndex >= 0 ? items[itemIndex + 1] : undefined
  const lastAdvanced = tokens
    .filter((token) => {
      if (nextItem) {
        return (
          !token.workflowProgress?.done &&
          token.workflowProgress!.currentIndex >= 0 &&
          token.workflowProgress?.steps[token.workflowProgress.currentIndex]?.id === nextItem.id
        )
      }
      return Boolean(token.workflowProgress?.done)
    })
    .reduce<SessionToken | null>(
      (best, token) => (!best || token.tokenNumber > best.tokenNumber ? token : best),
      null,
    )
  return {
    prevTokenLabel: previous?.tokenLabel ?? lastAdvanced?.tokenLabel ?? null,
    currentTokenLabel: current?.tokenLabel ?? null,
    nextTokenLabel: next?.tokenLabel ?? null,
    currentTokenId: current?.id ?? null,
    previousTokenId: previous?.id ?? null,
  }
}

export function computeWorkflowStepQueue(
  tokens: SessionToken[],
  item: ServiceWorkflowItem,
  items: ServiceWorkflowItem[],
  focusedTokenId?: string | null,
  checkedInUserIds?: Set<string>,
): {
  prevTokenLabel: string | null
  currentTokenLabel: string | null
  nextTokenLabel: string | null
  currentTokenId: string | null
  previousTokenId: string | null
} {
  const atStep = tokensAtWorkflowStep(tokens, item.id, {
    itemKind: item.kind,
    checkedInUserIds,
  })
  const focusedIndex = focusedTokenId
    ? atStep.findIndex((token) => token.id === focusedTokenId)
    : 0
  const idx = focusedIndex >= 0 ? focusedIndex : 0
  const current = atStep[idx] ?? null
  const next = atStep[idx + 1] ?? null
  const previous = atStep[idx - 1] ?? null
  const itemIndex = items.findIndex((entry) => entry.id === item.id)
  const nextItem = itemIndex >= 0 ? items[itemIndex + 1] : undefined
  const lastAdvanced = tokens
    .filter((token) => {
      if (nextItem) {
        return (
          !token.workflowProgress?.done &&
          token.workflowProgress!.currentIndex >= 0 &&
          token.workflowProgress?.steps[token.workflowProgress.currentIndex]?.id === nextItem.id
        )
      }
      return Boolean(token.workflowProgress?.done)
    })
    .reduce<SessionToken | null>(
      (best, token) => (!best || token.tokenNumber > best.tokenNumber ? token : best),
      null,
    )
  return {
    prevTokenLabel: previous?.tokenLabel ?? lastAdvanced?.tokenLabel ?? null,
    currentTokenLabel: current?.tokenLabel ?? null,
    nextTokenLabel: next?.tokenLabel ?? null,
    currentTokenId: current?.id ?? null,
    previousTokenId: previous?.id ?? null,
  }
}
