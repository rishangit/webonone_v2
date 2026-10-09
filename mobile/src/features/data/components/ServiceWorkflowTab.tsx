import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Card,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  Muted,
  Subheading,
} from '@webonone/mobile-ui'
import {
  companyCatalogApi,
  resolveCompanyCatalogServiceId,
} from '@/features/data/services/companyCatalogApi'
import type { ServiceWorkflowItem } from '@/features/sales/types/catalog.types'

function workflowItemTitle(item: ServiceWorkflowItem, checkInLabel: string): string {
  if (item.kind === 'check_in') return checkInLabel
  return item.space?.name ?? checkInLabel
}

/** Read-only workflow for Data library service detail (super_admin). */
export function ServiceWorkflowTab({
  libraryServiceId,
  catalogServiceId,
}: {
  libraryServiceId?: string
  catalogServiceId?: string
}) {
  const { t } = useTranslation('catalog')
  const [items, setItems] = useState<ServiceWorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let catalogId = catalogServiceId ?? null
      if (!catalogId && libraryServiceId) {
        catalogId = await resolveCompanyCatalogServiceId(libraryServiceId)
      }
      if (!catalogId) {
        setItems([])
        return
      }
      const result = await companyCatalogApi.listServiceWorkflow(catalogId)
      setItems(result.items ?? [])
    } catch (err) {
      setItems([])
      setError(err instanceof Error ? err.message : t('workflowTab.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [catalogServiceId, libraryServiceId, t])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Card className="gap-4">
      <View className="gap-1">
        <Subheading>{t('workflowTab.title')}</Subheading>
        <Muted>{t('workflowTab.description')}</Muted>
      </View>
      {error ? <Body className="text-sm text-destructive">{error}</Body> : null}
      {loading ? (
        <ItemListEmpty>{t('workflowTab.loading')}</ItemListEmpty>
      ) : items.length === 0 ? (
        <ItemListEmpty>{t('workflowTab.empty')}</ItemListEmpty>
      ) : (
        <ItemList className="py-0" nestedInCard>
          {items.map((item) => {
            const staffNames =
              item.staff.length > 0
                ? item.staff.map((member) => member.displayName).join(', ')
                : '—'
            return (
              <ItemListItem key={item.id}>
                <ItemListContent
                  title={`${item.orderNumber}. ${workflowItemTitle(item, t('workflowTab.checkIn'))}`}
                  subtitle={staffNames}
                />
              </ItemListItem>
            )
          })}
        </ItemList>
      )}
    </Card>
  )
}
