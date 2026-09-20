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
  listServiceWorkflow,
  resolveCompanyCatalogServiceId,
  type ServiceWorkflowItem,
} from '@/features/data/services/companyCatalogWorkflowApi'

function workflowItemTitle(item: ServiceWorkflowItem, checkInLabel: string): string {
  if (item.kind === 'check_in') return checkInLabel
  return item.space?.name ?? checkInLabel
}

export function ServiceWorkflowTab({ libraryServiceId }: { libraryServiceId: string }) {
  const { t } = useTranslation('catalog')
  const [items, setItems] = useState<ServiceWorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const catalogId = await resolveCompanyCatalogServiceId(libraryServiceId)
      if (!catalogId) {
        setItems([])
        return
      }
      const result = await listServiceWorkflow(catalogId)
      setItems(result.items ?? [])
    } catch (err) {
      setItems([])
      setError(err instanceof Error ? err.message : t('workflowTab.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [libraryServiceId, t])

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
        <ItemList className="py-0">
          {items.map((item) => {
            const staffNames =
              item.staff.length > 0
                ? item.staff.map((entry) => entry.displayName).join(', ')
                : t('workflowTab.none')
            const formNames =
              item.forms.length > 0
                ? item.forms.map((entry) => entry.name ?? entry.id).join(', ')
                : t('workflowTab.none')
            const extra = [
              t('workflowTab.staffLine', { value: staffNames }),
              t('workflowTab.formsLine', { value: formNames }),
              t('workflowTab.addItemsLine', {
                value: item.addItemsEnabled ? t('workflowTab.yes') : t('workflowTab.no'),
              }),
            ].join(' · ')
            return (
              <ItemListItem key={item.id}>
                <ItemListContent
                  title={workflowItemTitle(item, t('workflowTab.checkIn'))}
                  subtitle={extra}
                />
              </ItemListItem>
            )
          })}
        </ItemList>
      )}
    </Card>
  )
}
