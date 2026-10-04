import type { StatusTagVariant } from '@webonone/ui-kit'
import type { FeedbackStatus } from '@/features/feedback/schemas/feedbackSchemas'

export function feedbackStatusTagVariant(status: FeedbackStatus): StatusTagVariant {
  switch (status) {
    case 'todo':
      return 'pending'
    case 'ready_to_develop':
      return 'verified'
    case 'planned':
      return 'member'
    case 'in_progress':
      return 'unverified'
    case 'developed':
      return 'approved'
    case 'staging':
      return 'pending'
    case 'closed':
      return 'rejected'
    default:
      return 'pending'
  }
}
