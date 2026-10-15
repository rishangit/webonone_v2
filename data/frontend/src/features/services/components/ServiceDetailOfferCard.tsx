import { useTranslation } from 'react-i18next'
import { EditableSectionCard, ListPriceField, ReadOnlyField } from '@webonone/ui-kit'
import type { CatalogItem } from '@/shared/types/data.types'

type ServiceDetailOfferCardProps = {
  service: CatalogItem
  canEdit: boolean
  onEdit: () => void
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
  canEdit,
  onEdit,
}: ServiceDetailOfferCardProps) {
  const { t } = useTranslation('services')

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
        <ListPriceField label={t('list.price', { ns: 'products' })} value={service.listPrice} />
      </div>
    </EditableSectionCard>
  )
}
