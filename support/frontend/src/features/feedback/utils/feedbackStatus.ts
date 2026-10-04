import type { StatusTagVariant } from '@webonone/ui-kit'
import type { FeedbackStatus } from '@/features/feedback/schemas/feedbackSchemas'

export type FeedbackStatusTagProps = {
  variant: StatusTagVariant
  className?: string
}

/** Distinct color treatment per workflow status (theme tokens only). */
export function feedbackStatusTagProps(status: FeedbackStatus): FeedbackStatusTagProps {
  switch (status) {
    case 'todo':
      return { variant: 'member' }
    case 'ready_to_develop':
      return { variant: 'staff' }
    case 'planned':
      return { variant: 'super_admin' }
    case 'in_progress':
      return { variant: 'pending' }
    case 'developed':
      return { variant: 'approved' }
    case 'staging':
      return {
        variant: 'approved',
        className: 'border-success bg-background text-success',
      }
    case 'closed':
      return { variant: 'rejected' }
    default:
      return { variant: 'pending' }
  }
}

export function feedbackStatusTagVariant(status: FeedbackStatus): StatusTagVariant {
  return feedbackStatusTagProps(status).variant
}
