import { useTranslation } from 'react-i18next'
import { DropdownMenuItem, ItemListMenu } from '@webonone/ui-kit'
import type { FeedbackReport } from '@/features/feedback/services/feedbackApi'
import type { FeedbackStatus } from '@/features/feedback/schemas/feedbackSchemas'

type FeedbackStatusMenuProps = {
  item: FeedbackReport
  updatingId: string | null
  onStatusChange: (id: string, status: FeedbackStatus) => void
}

export function FeedbackStatusMenu({ item, updatingId, onStatusChange }: FeedbackStatusMenuProps) {
  const { t } = useTranslation('feedback')

  return (
    <ItemListMenu ariaLabel={t('statusMenuAria', { title: item.title })}>
      <DropdownMenuItem
        disabled={updatingId === item.id || item.status === 'todo'}
        onClick={() => onStatusChange(item.id, 'todo')}
      >
        {t('status.todo')}
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={updatingId === item.id || item.status === 'in_progress'}
        onClick={() => onStatusChange(item.id, 'in_progress')}
      >
        {t('status.in_progress')}
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={updatingId === item.id || item.status === 'completed'}
        onClick={() => onStatusChange(item.id, 'completed')}
      >
        {t('status.completed')}
      </DropdownMenuItem>
    </ItemListMenu>
  )
}
