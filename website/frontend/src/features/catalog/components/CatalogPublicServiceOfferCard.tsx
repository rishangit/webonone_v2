import { useTranslation } from 'react-i18next'
import { EditableSectionCard, ListPriceField, ReadOnlyField } from '@webonone/ui-kit'
import type { CatalogDetailItem } from '@/features/catalog/types/catalog.types'

type SessionSpace = { spaceId: string; spaceName: string }

type CatalogPublicServiceOfferCardProps = {
  item: CatalogDetailItem
  sessionSpaces: SessionSpace[]
  spacesLoading: boolean
}

function hasServiceTime(item: CatalogDetailItem): boolean {
  return item.kind === 'services' && (item.timeMode === 'window' || item.timeMode === 'duration')
}

export function CatalogPublicServiceOfferCard({
  item,
  sessionSpaces,
  spacesLoading,
}: CatalogPublicServiceOfferCardProps) {
  const { t } = useTranslation('search')

  if (item.kind !== 'services') return null

  const showWhere = item.timeMode === 'window'

  return (
    <EditableSectionCard title={t('serviceOffer.title')} description={t('serviceOffer.description')}>
      {hasServiceTime(item) ? (
        <div className="space-y-3 border-y border-border py-3">
          <ReadOnlyField
            label={t('timeMode')}
            value={item.timeMode === 'window' ? t('specificTime') : t('duration')}
          />
          {item.timeMode === 'duration' ? (
            <ReadOnlyField
              label={t('duration')}
              value={
                item.durationMinutes != null
                  ? t('durationMinutes', { minutes: String(item.durationMinutes) })
                  : '—'
              }
            />
          ) : null}
          {item.timeMode === 'window' ? (
            <>
              <ReadOnlyField label={t('startTime')} value={item.startTime ?? '—'} />
              <ReadOnlyField label={t('endTime')} value={item.endTime ?? '—'} />
            </>
          ) : null}
        </div>
      ) : null}

      {showWhere ? (
        <ReadOnlyField
          label={t('where')}
          value={
            spacesLoading
              ? t('loadingDetails')
              : sessionSpaces.length === 0
                ? t('noSpaceYet')
                : sessionSpaces.map((space) => space.spaceName).join(', ')
          }
        />
      ) : null}

      {item.listPrice != null ? (
        <ListPriceField
          label={t('productPricing.price')}
          value={item.listPrice}
          compareAt={item.listPriceCompareAt}
          discountPercent={item.listDiscountPercent}
        />
      ) : null}
    </EditableSectionCard>
  )
}
