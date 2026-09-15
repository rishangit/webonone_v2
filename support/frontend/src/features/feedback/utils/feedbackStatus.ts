import type { StatusTagVariant } from '@webonone/ui-kit'
import type { FeedbackStatus, FeedbackType } from '@/features/feedback/schemas/feedbackSchemas'

export function feedbackStatusTagVariant(status: FeedbackStatus): StatusTagVariant {
  switch (status) {
    case 'todo':
      return 'pending'
    case 'in_progress':
      return 'unverified'
    case 'completed':
      return 'approved'
    default:
      return 'pending'
  }
}

export function feedbackTypeTagVariant(type: FeedbackType): StatusTagVariant {
  return type === 'bug' ? 'rejected' : 'verified'
}
