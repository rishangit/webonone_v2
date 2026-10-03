import { useTranslation } from 'react-i18next'
import { formatDisplayDateTime } from '@webonone/i18n'
import {
  ImagePreview,
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
  onOpenDetail: (item: FeedbackReport) => void
}

export function FeedbackList({
  items,
  isSuperAdmin,
  updatingId,
  onStatusChange,
  onOpenDetail,
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
            <button
              type="button"
              className="min-w-0 space-y-1 text-left"
              onClick={() => onOpenDetail(item)}
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusTag variant="pending">#{item.ticketNumber}</StatusTag>
                <p className="truncate font-medium">{item.title}</p>
                <StatusTag variant={feedbackTypeTagVariant(item.type)}>
                  {t(`type.${item.type}`)}
                </StatusTag>
                <StatusTag variant={feedbackStatusTagVariant(item.status)}>
                  {t(`status.${item.status}`)}
                </StatusTag>
                {item.unreadCommentCount ? (
                  <StatusTag variant="member">
                    {t('unreadComments', { count: item.unreadCommentCount })}
                  </StatusTag>
                ) : null}
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
              {item.attachmentUrl ? (
                <a
                  href={item.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block pt-1"
                  aria-label={t('screenshotLinkAria', {
                    title: item.title,
                    fileName: item.attachmentFileName ?? 'screenshot',
                  })}
                >
                  <ImagePreview
                    src={item.attachmentUrl}
                    alt={item.attachmentFileName ?? t('screenshotAlt')}
                    mode="view"
                    className="h-16 w-16 rounded-md"
                  />
                </a>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {t('reportedBy', { email: item.reporterEmail })} ·{' '}
                {formatDisplayDateTime(item.createdAt, i18n.language)}
              </p>
            </button>
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
