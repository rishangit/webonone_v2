import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Body, Button, EditableSectionCard, ListPriceField, Muted, ReadOnlyField } from '@webonone/mobile-ui'
import { companyCatalogApi } from '@/features/data/services/companyCatalogApi'
import type { CatalogPayload } from '@/features/sales/types/catalog.types'

type CompanyServiceDetailOfferCardProps = {
  serviceId: string
  servicePayload: CatalogPayload | null
  listPrice: number | null | undefined
  canManagePrice: boolean
  canEditSchedule: boolean
  busy?: boolean
  overviewActive?: boolean
  onEditListPrice: () => void
  onEditSchedule: () => void
  onManageWorkflow: () => void
}

export function CompanyServiceDetailOfferCard({
  serviceId,
  servicePayload,
  listPrice,
  canManagePrice,
  canEditSchedule,
  busy = false,
  overviewActive = true,
  onEditListPrice,
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
      const workflow = await companyCatalogApi.listServiceWorkflow(serviceId)
      const names = workflow.items
        .map((item) => item.space?.name?.trim())
        .filter((name): name is string => Boolean(name))
      setSpaceNames([...new Set(names)])
    } catch (err) {
      setSpaceNames([])
      setSpacesError(err instanceof Error ? err.message : t('workflowTab.loadFailed'))
    }
  }, [serviceId, t])

  useEffect(() => {
    if (!overviewActive) return
    void loadSpaces()
  }, [loadSpaces, overviewActive])

  const canEditCard = (canManagePrice || canEditSchedule) && !busy
  const loadingSpaces = spaceNames === undefined
  const emptySpaces = spaceNames !== undefined && spaceNames.length === 0
  const mode = servicePayload?.timeMode

  function handleCardEdit() {
    if (canManagePrice) {
      onEditListPrice()
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
      <View className="gap-3 border-y border-border py-3">
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
              value={
                typeof servicePayload?.startTime === 'string' ? servicePayload.startTime : '—'
              }
            />
            <ReadOnlyField
              label={t('detail.time.endTime')}
              value={typeof servicePayload?.endTime === 'string' ? servicePayload.endTime : '—'}
            />
          </>
        ) : null}
      </View>

      <View className="gap-1">
        <Body className="text-xs font-medium text-muted">{t('detail.sessions.where')}</Body>
        {loadingSpaces ? (
          <Muted>{t('detail.serviceOffer.loadingSpaces')}</Muted>
        ) : spacesError ? (
          <Body className="text-sm text-destructive">{spacesError}</Body>
        ) : emptySpaces ? (
          <Muted>{t('detail.serviceOffer.noSpaces')}</Muted>
        ) : (
          <Body className="text-sm">{spaceNames?.join(', ')}</Body>
        )}
      </View>

      {canEditSchedule ? (
        <View className="flex-row flex-wrap gap-2">
          <Button variant="ghost" size="sm" onPress={onEditSchedule}>
            {t('detail.serviceOffer.editSchedule')}
          </Button>
          <Button variant="ghost" size="sm" onPress={onManageWorkflow}>
            {t('detail.serviceOffer.manageWorkflow')}
          </Button>
        </View>
      ) : null}

      <ListPriceField label={t('detail.pricing.listPrice')} value={listPrice} />
    </EditableSectionCard>
  )
}
