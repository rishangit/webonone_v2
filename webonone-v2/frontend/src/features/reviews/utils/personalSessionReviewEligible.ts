import type { SessionRunStatus, SessionToken } from '@/features/calendar/types/event.types'

export type SessionReviewEligibilityInput = {
  currentUserId: string | null | undefined
  timeMode: 'duration' | 'window'
  runStatus: SessionRunStatus
  attendeeUserId: string | null | undefined
  tokens: SessionToken[]
  viewerCheckedIn: boolean
}

/** User attended / completed this session and may rate the linked catalog service. */
export function isSessionReviewEligible(input: SessionReviewEligibilityInput): boolean {
  if (!input.currentUserId) return false

  if (input.timeMode === 'duration') {
    return (
      input.runStatus === 'ended' &&
      Boolean(input.attendeeUserId) &&
      input.attendeeUserId === input.currentUserId
    )
  }

  const myToken = input.tokens.find((token) => token.userId === input.currentUserId)
  if (myToken?.status === 'completed') return true
  return input.runStatus === 'ended' && input.viewerCheckedIn
}

/** Default-user personal calendar — same attendance rules as {@link isSessionReviewEligible}. */
export function isPersonalSessionReviewEligible(
  input: SessionReviewEligibilityInput & { isPersonal: boolean },
): boolean {
  if (!input.isPersonal) return false
  return isSessionReviewEligible(input)
}
