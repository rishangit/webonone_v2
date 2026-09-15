import { useTranslation } from 'react-i18next'
import { formatDisplayDateTime } from '@webonone/i18n'
import {
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  StatusTag,
} from '@webonone/ui-kit'
import { FeedbackStatusMenu } from '@/features/feedback/components/FeedbackStatusMenu'
import type { FeedbackReport } from '@/features/feedback/services/feedbackApi'
import type { FeedbackStatus } from '@/features/feedback/schemas/feedbackSchemas'
import {
  feedbackStatusTagVariant,
  feedbackTypeTagVariant,
} from '@/features/feedback/utils/feedbackStatus'

type FeedbackListProps = {
  items: FeedbackReport[]
  isSuperAdmin: boolean
  updatingId: string | null
  onStatusChange: (id: string, status: FeedbackStatus) => void
}

export function FeedbackList({
  items,
  isSuperAdmin,
  updatingId,
  onStatusChange,
}: FeedbackListProps) {
  const { t, i18n } = useTranslation('feedback')

  if (items.length === 0) {
    return <ItemListEmpty>{t('empty')}</ItemListEmpty>
  }

  return (
    <ItemList>
      {items.map((item) => (
        <ItemListItem key={item.id}>
          <ItemListContent>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{item.title}</p>
                <StatusTag variant={feedbackTypeTagVariant(item.type)}>
                  {t(`type.${item.type}`)}
                </StatusTag>
                <StatusTag variant={feedbackStatusTagVariant(item.status)}>
                  {t(`status.${item.status}`)}
                </StatusTag>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
              <p className="text-xs text-muted-foreground">
                {t('reportedBy', { email: item.reporterEmail })} ·{' '}
                {formatDisplayDateTime(item.createdAt, i18n.language)}
              </p>
            </div>
          </ItemListContent>
          {isSuperAdmin ? (
            <FeedbackStatusMenu
              item={item}
              updatingId={updatingId}
              onStatusChange={onStatusChange}
            />
          ) : null}
        </ItemListItem>
      ))}
    </ItemList>
  )
}
