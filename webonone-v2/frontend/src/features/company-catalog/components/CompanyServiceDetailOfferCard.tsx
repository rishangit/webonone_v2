import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, EditableSectionCard, ReadOnlyField } from '@webonone/ui-kit'
import { CatalogApplicablePrice } from '@/features/company-catalog/components/CatalogApplicablePrice'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import type { CatalogPriceRule } from '@/features/company-catalog/types/catalogPriceRule.types'
import type { CatalogPayload } from '@/features/company-catalog/types/companyCatalog.types'

type CompanyServiceDetailOfferCardProps = {
  serviceId: string
  companyId?: string
  servicePayload: CatalogPayload | null
  priceRules: CatalogPriceRule[]
  priceRulesLoading?: boolean
  canManagePrice: boolean
  canEditSchedule: boolean
  busy?: boolean
  overviewActive?: boolean
  onManagePrices: () => void
  onEditSchedule: () => void
  onManageWorkflow: () => void
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
  priceRules,
  priceRulesLoading = false,
  canManagePrice,
  canEditSchedule,
  busy = false,
  overviewActive = true,
  onManagePrices,
  onEditSchedule,
  onManageWorkflow,
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

  const canEditCard = (canManagePrice || canEditSchedule) && !busy
  const loadingSpaces = spaceNames === undefined
  const emptySpaces = spaceNames !== undefined && spaceNames.length === 0

  function handleCardEdit() {
    if (canManagePrice) {
      onManagePrices()
      return
    }
    if (canEditSchedule) {
      onEditSchedule()
    }
  }

  return (
    <EditableSectionCard
      title={t('detail.serviceOffer.title')}
      description={t('detail.serviceOffer.description')}
      canEdit={canEditCard}
      onEdit={handleCardEdit}
    >
      <div className="space-y-4">
        <div className="space-y-3 border-y border-border py-3">
          <ServiceTimeFields servicePayload={servicePayload} t={t} />
        </div>

        <div className="space-y-2">
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
          {canEditSchedule || canManagePrice ? (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {canEditSchedule ? (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={onEditSchedule}
                >
                  {t('detail.serviceOffer.editSchedule')}
                </Button>
              ) : null}
              {canEditSchedule ? (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={onManageWorkflow}
                >
                  {t('detail.serviceOffer.manageWorkflow')}
                </Button>
              ) : null}
              {canManagePrice ? (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={onManagePrices}
                >
                  {t('priceList.manage')}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <CatalogApplicablePrice rules={priceRules} loading={priceRulesLoading && overviewActive} />
      </div>
    </EditableSectionCard>
  )
}
