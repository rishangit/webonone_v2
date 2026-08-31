import { useCallback, useEffect, useState } from 'react'

import { useTranslation } from 'react-i18next'

import {

  Card,

  CardContent,

  CardDescription,

  CardHeader,

  CardTitle,

  ItemListEmpty,

} from '@webonone/ui-kit'

import { designFormsApi, type DesignFormTemplateListItem } from '@/features/design/services/designFormsApi'

import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'

import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'

import { WorkflowItemList } from '@/features/company-catalog/components/WorkflowItemList'

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

          <WorkflowItemList items={items} t={t} />

        )}

      </CardContent>

    </Card>

  )

}

