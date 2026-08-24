import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
} from '@webonone/ui-kit'
import { designFormsApi, type DesignFormTemplateListItem } from '@/features/design/services/designFormsApi'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'
import { hydrateLinkedCatalogItems } from '@/features/company-catalog/utils/hydrateLinkedCatalog'

type CompanyServiceWorkflowOverviewCardProps = {
  serviceId: string
  companyId?: string
}

export function CompanyServiceWorkflowOverviewCard({
  serviceId,
  companyId,
}: CompanyServiceWorkflowOverviewCardProps) {
  const { t } = useTranslation('catalog')
  const [items, setItems] = useState<ServiceWorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [workflow, spacesResult, formsResult] = await Promise.all([
        companyId
          ? companyCatalogApi.listServiceWorkflowForCompany(companyId, serviceId)
          : companyCatalogApi.listServiceWorkflow(serviceId),
        companyId
          ? companyCatalogApi.listForCompany(companyId, 'spaces')
          : companyCatalogApi.list('spaces'),
        designFormsApi.listPublished().catch(() => ({ items: [] as DesignFormTemplateListItem[] })),
      ])
      const spaces = await hydrateLinkedCatalogItems('spaces', spacesResult.items)
      const spaceNameById = new Map(spaces.map((space) => [space.id, space.displayName]))
      const formNameById = new Map(formsResult.items.map((form) => [form.id, form.name]))
      setItems(
        workflow.items.map((item) => ({
          ...item,
          space: item.space
            ? {
                id: item.space.id,
                name: spaceNameById.get(item.space.id) ?? item.space.name,
              }
            : null,
          forms: item.forms.map((form) => ({
            id: form.id,
            name: formNameById.get(form.id) ?? form.name ?? form.id,
          })),
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : t('workflowTab.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [companyId, serviceId, t])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('detail.workflow.title')}</CardTitle>
        <CardDescription>{t('detail.workflow.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && items.length === 0 ? (
          <ItemListEmpty>{t('workflowTab.loading')}</ItemListEmpty>
        ) : items.length === 0 ? (
          <ItemListEmpty>{t('detail.workflow.empty')}</ItemListEmpty>
        ) : (
          <ItemList>
            {items.map((item) => (
              <ItemListItem key={item.id}>
                <ItemListContent>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="shrink-0 text-sm font-semibold text-muted-foreground">
                      #{item.orderNumber}
                    </span>
                    <p className="truncate font-medium">
                      {item.kind === 'check_in'
                        ? t('workflowTab.checkIn')
                        : (item.space?.name ?? t('workflowTab.checkIn'))}
                    </p>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {t('workflowTab.staffLine', {
                      value:
                        item.staff.length > 0
                          ? item.staff.map((entry) => entry.displayName).join(', ')
                          : t('workflowTab.none'),
                    })}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {t('workflowTab.formsLine', {
                      value:
                        item.forms.length > 0
                          ? item.forms.map((entry) => entry.name ?? entry.id).join(', ')
                          : t('workflowTab.none'),
                    })}
                  </p>
                </ItemListContent>
              </ItemListItem>
            ))}
          </ItemList>
        )}
      </CardContent>
    </Card>
  )
}
