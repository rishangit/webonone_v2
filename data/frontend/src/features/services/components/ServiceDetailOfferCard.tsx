import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, EditableSectionCard, ListPriceField, ReadOnlyField } from '@webonone/ui-kit'
import { dataApi } from '@/shared/services/dataApi'
import type { CatalogItem, ServiceSpaceLink } from '@/shared/types/data.types'

type ServiceDetailOfferCardProps = {
  service: CatalogItem
  serviceId: string
  canEdit: boolean
  onEdit: () => void
  onManageSpaces: () => void
  /** When true, linked spaces are loaded (refetch when user returns from Spaces tab). */
  overviewActive?: boolean
}

function ServiceTimeFields({ service }: { service: CatalogItem }) {
  const { t } = useTranslation('services')
  const mode = service.timeMode
  return (
    <>
      <ReadOnlyField
        label={t('timeMode')}
        value={
          mode === 'window'
            ? t('timeModeWindow')
            : mode === 'duration'
              ? t('timeModeDuration')
              : t('noDescription')
        }
      />
      {mode === 'duration' ? (
        <ReadOnlyField
          label={t('duration')}
          value={
            service.durationMinutes != null
              ? t('durationValue', { count: service.durationMinutes })
              : t('noDescription')
          }
        />
      ) : null}
      {mode === 'window' ? (
        <>
          <ReadOnlyField label={t('startTime')} value={service.startTime ?? t('noDescription')} />
          <ReadOnlyField label={t('endTime')} value={service.endTime ?? t('noDescription')} />
        </>
      ) : null}
    </>
  )
}

export function ServiceDetailOfferCard({
  service,
  serviceId,
  canEdit,
  onEdit,
  onManageSpaces,
  overviewActive = true,
}: ServiceDetailOfferCardProps) {
  const { t } = useTranslation('services')
  const [spaces, setSpaces] = useState<ServiceSpaceLink[] | undefined>()
  const [spacesError, setSpacesError] = useState<string | null>(null)

  const loadSpaces = useCallback(async () => {
    setSpaces(undefined)
    setSpacesError(null)
    try {
      const result = await dataApi.listServiceSpaces(serviceId)
      setSpaces(result.items)
    } catch (err) {
      setSpaces([])
      setSpacesError(err instanceof Error ? err.message : t('catalog.spacesLoadFailed'))
    }
  }, [serviceId, t])

  useEffect(() => {
    if (!overviewActive) return
    void loadSpaces()
  }, [loadSpaces, overviewActive])

  const loadingSpaces = spaces === undefined
  const emptySpaces = spaces !== undefined && spaces.length === 0

  return (
    <EditableSectionCard
      title={t('detailOffer.title')}
      description={t('detailOffer.description')}
      canEdit={canEdit}
      onEdit={onEdit}
    >
      <div className="space-y-4">
        <div className="space-y-3 border-y border-border py-3">
          <ServiceTimeFields service={service} />
        </div>

        <div className="space-y-2">
          <ReadOnlyField
            label={t('detailOffer.where')}
            value={
              loadingSpaces
                ? t('detailOffer.loadingSpaces')
                : spacesError
                  ? spacesError
                  : emptySpaces
                    ? t('detailOffer.noSpaces')
                    : spaces?.map((space) => space.name).join(', ')
            }
          />
          {canEdit ? (
            <Button type="button" variant="link" className="h-auto p-0 text-sm" onClick={onManageSpaces}>
              {t('detailOffer.manageSpaces')}
            </Button>
          ) : null}
        </div>

        <ListPriceField label={t('list.price', { ns: 'products' })} value={service.listPrice} />
      </div>
    </EditableSectionCard>
  )
}
