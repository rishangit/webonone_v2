import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'
import type { SessionToken } from '@/features/calendar/types/event.types'

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

export function tokensAtWorkflowStep(tokens: SessionToken[], itemId: string): SessionToken[] {
  return tokens
    .filter(
      (token) =>
        !token.workflowProgress?.done &&
        token.workflowProgress?.steps[token.workflowProgress.currentIndex]?.id === itemId,
    )
    .slice()
    .sort((a, b) => a.tokenNumber - b.tokenNumber)
}

export function computeWorkflowStepQueue(
  tokens: SessionToken[],
  item: ServiceWorkflowItem,
  items: ServiceWorkflowItem[],
  focusedTokenId?: string | null,
): {
  prevTokenLabel: string | null
  currentTokenLabel: string | null
  nextTokenLabel: string | null
  currentTokenId: string | null
  previousTokenId: string | null
} {
  const atStep = tokensAtWorkflowStep(tokens, item.id)
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
