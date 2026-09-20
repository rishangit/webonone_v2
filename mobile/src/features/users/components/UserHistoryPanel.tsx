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
  loadCustomerHistory,
  loadUserHistory,
  resolveSaleId,
  resolveSessionTokenId,
  type UserHistoryItem,
} from '@/features/users/services/userHistoryApi'
import type { IdentityUserDetail } from '@/features/users/types/users.types'
import {
  userHistorySalePath,
  userHistorySubmissionPath,
  userHistoryTokenPath,
} from '@/features/users/utils/userPaths'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

function historyTitle(item: UserHistoryItem, t: (key: string) => string): string {
  if (item.kind === 'form_submission') return item.formName
  return item.title || t('history.eventSessionFallback')
}

function historySubtitle(
  item: UserHistoryItem,
  t: (key: string, options?: Record<string, string>) => string,
  showCompany: boolean,
): string {
  const companyName =
    showCompany && item.kind === 'company_activity' && typeof item.meta?.companyName === 'string'
      ? item.meta.companyName
      : null
  const companyPart = companyName ? t('history.companyPrefix', { name: companyName }) : null

  if (item.kind === 'form_submission') {
    return [
      companyPart,
      item.serviceName ? t('history.servicePrefix', { name: item.serviceName }) : null,
      t('history.filledBy', { name: item.filledByDisplayName }),
    ]
      .filter(Boolean)
      .join(' · ')
  }
  return [
    companyPart,
    item.subtitle,
    item.status ? t('history.statusPrefix', { status: item.status }) : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

function historyBadge(item: UserHistoryItem, t: (key: string) => string): string {
  if (item.kind === 'form_submission') return t('history.badgeForm')
  if (item.kind === 'company_activity' && item.type === 'sale') return t('history.badgeSale')
  return t('history.badgeSession')
}

function isHistoryItemClickable(item: UserHistoryItem): boolean {
  return (
    item.kind === 'form_submission' ||
    (item.kind === 'company_activity' && (item.type === 'session_token' || item.type === 'sale'))
  )
}

type UserHistoryPanelProps = {
  user: IdentityUserDetail
  companyCustomersMode: boolean
}

export function UserHistoryPanel({ user, companyCustomersMode }: UserHistoryPanelProps) {
  const { t } = useTranslation('users')
  const router = useRouter()
  const [items, setItems] = useState<UserHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const loader = companyCustomersMode ? loadCustomerHistory : loadUserHistory
    loader(user.id)
      .then((next) => {
        if (!cancelled) setItems(next)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('errors.loadHistoryFailed'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [companyCustomersMode, user.id, t])

  function openHistoryItem(item: UserHistoryItem) {
    if (item.kind === 'form_submission') {
      router.push(userHistorySubmissionPath(user.id, item.id) as Href)
      return
    }
    if (item.type === 'session_token') {
      const tokenId = resolveSessionTokenId(item)
      if (tokenId) router.push(userHistoryTokenPath(user.id, tokenId) as Href)
      return
    }
    if (item.type === 'sale') {
      const saleId = resolveSaleId(item)
      if (saleId) router.push(userHistorySalePath(user.id, saleId) as Href)
    }
  }

  if (loading) {
    return <Spinner label={t('loading.history')} />
  }

  if (error) {
    return <Body className="text-destructive">{error}</Body>
  }

  if (items.length === 0) {
    return <ItemListEmpty>{t('empty.history')}</ItemListEmpty>
  }

  const showCompany = !companyCustomersMode

  return (
    <ItemList>
      {items.map((item) => {
        const when = item.kind === 'form_submission' ? item.createdAt : item.occurredAt
        const subtitle = `${historySubtitle(item, t, showCompany)} · ${formatDisplayDateTime(when)}`
        const clickable = isHistoryItemClickable(item)
        return (
          <ItemListItem
            key={item.id}
            onPress={clickable ? () => openHistoryItem(item) : undefined}
          >
            <View className="min-w-0 flex-1 flex-row items-start justify-between gap-2">
              <ItemListContent title={historyTitle(item, t)} subtitle={subtitle} />
              <Badge tone="neutral">{historyBadge(item, t)}</Badge>
            </View>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}
