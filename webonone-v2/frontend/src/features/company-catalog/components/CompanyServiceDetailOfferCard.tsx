import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EditableSectionCard, ReadOnlyField } from '@webonone/ui-kit'
import { CatalogApplicablePrice } from '@/features/company-catalog/components/CatalogApplicablePrice'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import type { CatalogDiscount, CatalogPrice } from '@/features/company-catalog/types/catalogPricing.types'
import type { CatalogPayload } from '@/features/company-catalog/types/companyCatalog.types'

type CompanyServiceDetailOfferCardProps = {
  serviceId: string
  companyId?: string
  servicePayload: CatalogPayload | null
  prices: CatalogPrice[]
  discounts: CatalogDiscount[]
  pricingLoading?: boolean
  canEdit: boolean
  busy?: boolean
  overviewActive?: boolean
  onEdit: () => void
}

function ServiceTimeFields({
  servicePayload,
  t,
}: {
  servicePayload: CatalogPayload | null
  t: (key: string, options?: { count?: number }) => string
}) {
  const mode = servicePayload?.timeMode
  return (
    <>
      <ReadOnlyField
        label={t('detail.time.timeMode')}
        value={
          mode === 'window'
            ? t('serviceWizard.fields.specificTime')
            : mode === 'duration'
              ? t('serviceWizard.fields.duration')
              : '—'
        }
      />
      {mode === 'duration' ? (
        <ReadOnlyField
          label={t('detail.time.duration')}
          value={
            typeof servicePayload?.durationMinutes === 'number'
              ? t('detail.durationMinutes', { count: servicePayload.durationMinutes })
              : '—'
          }
        />
      ) : null}
      {mode === 'window' ? (
        <>
          <ReadOnlyField
            label={t('detail.time.startTime')}
            value={typeof servicePayload?.startTime === 'string' ? servicePayload.startTime : '—'}
          />
          <ReadOnlyField
            label={t('detail.time.endTime')}
            value={typeof servicePayload?.endTime === 'string' ? servicePayload.endTime : '—'}
          />
        </>
      ) : null}
    </>
  )
}

export function CompanyServiceDetailOfferCard({
  serviceId,
  companyId,
  servicePayload,
  prices,
  discounts,
  pricingLoading = false,
  canEdit,
  busy = false,
  overviewActive = true,
  onEdit,
}: CompanyServiceDetailOfferCardProps) {
  const { t } = useTranslation('catalog')
  const [spaceNames, setSpaceNames] = useState<string[] | undefined>()
  const [spacesError, setSpacesError] = useState<string | null>(null)

  const loadSpaces = useCallback(async () => {
    setSpaceNames(undefined)
    setSpacesError(null)
    try {
      const workflow = companyId
        ? await companyCatalogApi.listServiceWorkflowForCompany(companyId, serviceId)
        : await companyCatalogApi.listServiceWorkflow(serviceId)
      const names = workflow.items
        .map((item) => item.space?.name?.trim())
        .filter((name): name is string => Boolean(name))
      setSpaceNames([...new Set(names)])
    } catch (err) {
      setSpaceNames([])
      setSpacesError(err instanceof Error ? err.message : t('workflowTab.loadFailed'))
    }
  }, [companyId, serviceId, t])

  useEffect(() => {
    if (!overviewActive) return
    void loadSpaces()
  }, [loadSpaces, overviewActive])

  const loadingSpaces = spaceNames === undefined
  const emptySpaces = spaceNames !== undefined && spaceNames.length === 0

  return (
    <EditableSectionCard
      title={t('detail.serviceOffer.title')}
      description={t('detail.serviceOffer.description')}
      canEdit={canEdit && !busy}
      onEdit={onEdit}
    >
      <div className="space-y-4">
        <div className="space-y-3 border-y border-border py-3">
          <ServiceTimeFields servicePayload={servicePayload} t={t} />
        </div>

        <ReadOnlyField
          label={t('detail.sessions.where')}
          value={
            loadingSpaces
              ? t('detail.serviceOffer.loadingSpaces')
              : spacesError
                ? spacesError
                : emptySpaces
                  ? t('detail.serviceOffer.noSpaces')
                  : spaceNames?.join(', ')
          }
        />

        <CatalogApplicablePrice
          prices={prices}
          discounts={discounts}
          loading={pricingLoading && overviewActive}
        />
      </div>
    </EditableSectionCard>
  )
}
