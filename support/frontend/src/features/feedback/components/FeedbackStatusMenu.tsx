import { useTranslation } from 'react-i18next'
import { DropdownMenuItem, ItemListMenu } from '@webonone/ui-kit'
import type { FeedbackReport } from '@/features/feedback/services/feedbackApi'
import {
  FEEDBACK_STATUS_ORDER,
  type FeedbackStatus,
} from '@/features/feedback/schemas/feedbackSchemas'

type FeedbackStatusMenuProps = {
  item: FeedbackReport
  updatingId: string | null
  onStatusChange: (id: string, status: FeedbackStatus) => void
}

export function FeedbackStatusMenu({ item, updatingId, onStatusChange }: FeedbackStatusMenuProps) {
  const { t } = useTranslation('feedback')

  return (
    <ItemListMenu ariaLabel={t('statusMenuAria', { title: item.title })}>
      {FEEDBACK_STATUS_ORDER.map((status) => (
        <DropdownMenuItem
          key={status}
          disabled={updatingId === item.id || item.status === status}
          onClick={() => onStatusChange(item.id, status)}
        >
          {t(`status.${status}`)}
        </DropdownMenuItem>
      ))}
    </ItemListMenu>
  )
}
