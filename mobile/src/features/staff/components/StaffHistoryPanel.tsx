import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Badge,
  Body,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  Spinner,
} from '@webonone/mobile-ui'
import {
  loadStaffHistory,
  resolveSessionTokenId,
  type UserHistoryItem,
} from '@/features/staff/services/staffHistoryApi'
import {
  staffHistorySubmissionPath,
  staffHistoryTokenPath,
} from '@/features/staff/utils/staffPaths'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

type StaffHistoryPanelProps = {
  staffId: string
  userId: string
}

function historyTitle(item: UserHistoryItem): string {
  if (item.kind === 'form_submission') return item.formName
  return item.title
}

function isClickable(item: UserHistoryItem): boolean {
  return (
    item.kind === 'form_submission' ||
    (item.kind === 'company_activity' && item.type === 'session_token')
  )
}

export function StaffHistoryPanel({ staffId, userId }: StaffHistoryPanelProps) {
  const { t } = useTranslation('staff')
  const router = useRouter()
  const [items, setItems] = useState<UserHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function historySubtitle(item: UserHistoryItem): string {
    if (item.kind === 'form_submission') {
      return [
        item.serviceName ? t('history.servicePrefix', { name: item.serviceName }) : null,
        t('history.forSubject', { name: item.subjectDisplayName }),
      ]
        .filter(Boolean)
        .join(' · ')
    }
    return [
      item.subtitle,
      item.status ? t('history.statusPrefix', { status: item.status }) : null,
    ]
      .filter(Boolean)
      .join(' · ')
  }

  function historyBadge(item: UserHistoryItem): string {
    if (item.kind === 'form_submission') return t('history.kindForm')
    return t('history.kindSession')
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loadStaffHistory(userId)
      .then((next) => {
        if (!cancelled) setItems(next)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('history.unableToLoad'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId, t])

  function openHistoryItem(item: UserHistoryItem) {
    if (item.kind === 'form_submission') {
      router.push(staffHistorySubmissionPath(staffId, item.id) as Href)
      return
    }
    if (item.type === 'session_token') {
      const tokenId = resolveSessionTokenId(item)
      if (tokenId) router.push(staffHistoryTokenPath(staffId, tokenId) as Href)
    }
  }

  if (loading) {
    return <Spinner label={t('detail.loading')} />
  }

  if (error) {
    return <Body className="text-destructive">{error}</Body>
  }

  if (items.length === 0) {
    return <ItemListEmpty>{t('history.empty')}</ItemListEmpty>
  }

  return (
    <ItemList>
      {items.map((item) => {
        const when = item.kind === 'form_submission' ? item.createdAt : item.occurredAt
        const subtitle = `${historySubtitle(item)} · ${formatDisplayDateTime(when)}`
        const clickable = isClickable(item)
        return (
          <ItemListItem
            key={item.id}
            onPress={clickable ? () => openHistoryItem(item) : undefined}
          >
            <View className="min-w-0 flex-1 flex-row items-start justify-between gap-2">
              <ItemListContent title={historyTitle(item)} subtitle={subtitle} />
              <Badge tone="neutral">{historyBadge(item)}</Badge>
            </View>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}
