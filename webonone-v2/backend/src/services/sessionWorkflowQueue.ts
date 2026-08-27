import type { TokenWorkflowProgressDto } from './tokenWorkflowProgress.js'
import type { WorkflowStepDef } from './tokenWorkflowProgress.js'

export type WorkflowStepQueueLabels = {
  prevTokenLabel: string | null
  currentTokenLabel: string | null
  nextTokenLabel: string | null
  currentTokenId: string | null
}

type SessionTokenForQueue = {
  id: string
  tokenNumber: number
  tokenLabel: string
  status: 'waiting' | 'serving' | 'completed'
  userId: string
  workflowProgress: TokenWorkflowProgressDto
}

function tokensAtWorkflowStep(
  tokens: SessionTokenForQueue[],
  itemId: string,
  itemKind: 'check_in' | 'space',
  checkedInUserIds: Set<string>,
): SessionTokenForQueue[] {
  return tokens
    .filter((token) => {
      if (token.workflowProgress.done) return false
      const progress = token.workflowProgress
      if (itemKind === 'check_in') {
        const checkInStep = progress.steps.find(
          (step) => step.id === itemId && step.kind === 'check_in',
        )
        if (!checkInStep) return false
        if (checkedInUserIds.has(token.userId)) return true
        if (progress.currentIndex < 0) return true
        return progress.steps[progress.currentIndex]?.id === itemId
      }
      if (progress.currentIndex < 0) return false
      return progress.steps[progress.currentIndex]?.id === itemId
    })
    .slice()
    .sort((a, b) => a.tokenNumber - b.tokenNumber)
}

/** Per-step Prev/Current/Next for viewers — computed from the full session token list. */
export function computeWorkflowStepViewerQueue(
  tokens: SessionTokenForQueue[],
  def: WorkflowStepDef,
  allDefs: WorkflowStepDef[],
  checkedInUserIds: Set<string>,
): WorkflowStepQueueLabels {
  const atStep = tokensAtWorkflowStep(tokens, def.id, def.kind, checkedInUserIds)
  if (atStep.length === 0) {
    return {
      prevTokenLabel: null,
      currentTokenLabel: null,
      nextTokenLabel: null,
      currentTokenId: null,
    }
  }
  const servingIdx = atStep.findIndex((token) => token.status === 'serving')
  const idx = servingIdx >= 0 ? servingIdx : 0
  const current = atStep[idx] ?? null
  const next = atStep[idx + 1] ?? null
  const previous = atStep[idx - 1] ?? null
  const itemIndex = allDefs.findIndex((entry) => entry.id === def.id)
  const nextDef = itemIndex >= 0 ? allDefs[itemIndex + 1] : undefined
  const lastAdvanced = tokens
    .filter((token) => {
      const progress = token.workflowProgress
      if (nextDef) {
        return (
          !progress.done &&
          progress.currentIndex >= 0 &&
          progress.steps[progress.currentIndex]?.id === nextDef.id
        )
      }
      return progress.done
    })
    .reduce<SessionTokenForQueue | null>(
      (best, token) => (!best || token.tokenNumber > best.tokenNumber ? token : best),
      null,
    )
  return {
    prevTokenLabel: previous?.tokenLabel ?? lastAdvanced?.tokenLabel ?? null,
    currentTokenLabel: current?.tokenLabel ?? null,
    nextTokenLabel: next?.tokenLabel ?? null,
    currentTokenId: current?.id ?? null,
  }
}

export function computeWorkflowStepQueuesForService(
  tokens: SessionTokenForQueue[],
  workflowItems: { id: string; session_queue: boolean | number }[],
  defs: WorkflowStepDef[],
  checkedInUserIds: Set<string>,
): Record<string, WorkflowStepQueueLabels> {
  const queues: Record<string, WorkflowStepQueueLabels> = {}
  for (const item of workflowItems) {
    if (!Number(item.session_queue)) continue
    const def = defs.find((entry) => entry.id === item.id)
    if (!def) continue
    queues[item.id] = computeWorkflowStepViewerQueue(tokens, def, defs, checkedInUserIds)
  }
  return queues
}
