import { useTranslation } from 'react-i18next'
import { Bug, Lightbulb } from 'lucide-react'
import { formatDisplayDateTime } from '@webonone/i18n'
import {
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListStatus,
  StatusTag,
} from '@webonone/ui-kit'
import { FeedbackStatusMenu } from '@/features/feedback/components/FeedbackStatusMenu'
import type { FeedbackReport } from '@/features/feedback/services/feedbackApi'
import type { FeedbackStatus, FeedbackType } from '@/features/feedback/schemas/feedbackSchemas'
import { feedbackStatusTagVariant } from '@/features/feedback/utils/feedbackStatus'

type FeedbackListProps = {
  items: FeedbackReport[]
  isSuperAdmin: boolean
  updatingId: string | null
  onStatusChange: (id: string, status: FeedbackStatus) => void
  onOpenDetail: (item: FeedbackReport) => void
}

function FeedbackTypeIcon({ type }: { type: FeedbackType }) {
  const Icon = type === 'bug' ? Bug : Lightbulb
  return (
    <Icon
      className={
        type === 'bug'
          ? 'mt-0.5 h-5 w-5 shrink-0 self-start text-destructive'
          : 'mt-0.5 h-5 w-5 shrink-0 self-start text-primary'
      }
      aria-hidden
    />
  )
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
          <FeedbackTypeIcon type={item.type} />
          <ItemListContent>
            <button
              type="button"
              className="min-w-0 w-full space-y-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${t(`type.${item.type}`)}: ${item.title}`}
              onClick={() => onOpenDetail(item)}
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusTag variant="pending">#{item.ticketNumber}</StatusTag>
                <p className="truncate font-medium">{item.title}</p>
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
          <ItemListStatus>
            <StatusTag variant={feedbackStatusTagVariant(item.status)}>
              {t(`status.${item.status}`)}
            </StatusTag>
          </ItemListStatus>
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
