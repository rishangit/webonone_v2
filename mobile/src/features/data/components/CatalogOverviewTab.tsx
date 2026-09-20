import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Card,
  EditableSectionCard,
  ImagePreview,
  ReadOnlyField,
  TagChip,
} from '@webonone/mobile-ui'
import { DetailStack, EntityMetaCard } from '@/features/data/components/EntityMetaCard'
import { EntityStatusTag } from '@/features/data/components/EntityStatusTag'
import type { CatalogKind } from '@/features/data/utils/dataPaths'
import type { CatalogItem } from '@/shared/types/data.types'

export type CatalogOverviewEditSection = 'basics' | 'tags' | 'time'

export function CatalogOverviewTab({
  kind,
  item,
  canEdit,
  onEditSection,
}: {
  kind: CatalogKind
  item: CatalogItem
  canEdit: boolean
  onEditSection: (section: CatalogOverviewEditSection) => void
}) {
  const { t } = useTranslation(kind)
  const { t: tc } = useTranslation('common')
  const images = item.galleryImages ?? []
  const firstImage = images[0]
  const restImages = images.slice(1)

  return (
    <DetailStack>
      {firstImage ? (
        <Card className="gap-3">
          <ImagePreview
            src={firstImage.url}
            alt={item.name}
            className="h-48 w-full rounded-lg"
          />
          {restImages.length > 0 ? (
            <View className="flex-row flex-wrap gap-3">
              {restImages.map((image) => (
                <ImagePreview
                  key={image.mediaId}
                  src={image.url}
                  alt={item.name}
                  className="h-20 w-20 rounded-lg"
                />
              ))}
            </View>
          ) : null}
        </Card>
      ) : null}

      <EditableSectionCard
        title={t('singular')}
        description={t('sectionDescription')}
        canEdit={canEdit}
        onEdit={() => onEditSection('basics')}
      >
        <View className="flex-row flex-wrap items-center gap-2">
          <Body className="text-xl font-semibold">{item.name}</Body>
          <EntityStatusTag status={item.status} />
        </View>
        <ReadOnlyField
          label={tc('description')}
          value={item.description?.trim() ? item.description : t('noDescription')}
        />
      </EditableSectionCard>

      {kind === 'services' ? (
        <EditableSectionCard
          title={t('time')}
          description={t('timeDescription')}
          canEdit={canEdit}
          onEdit={() => onEditSection('time')}
        >
          <ServiceTimeFields item={item} />
        </EditableSectionCard>
      ) : null}

      <EditableSectionCard
        title={t('tags')}
        description={t('tagsDescription')}
        canEdit={canEdit}
        onEdit={() => onEditSection('tags')}
      >
        {item.tags.length === 0 ? (
          <Body className="text-sm text-muted">{t('noTags')}</Body>
        ) : (
          <View className="flex-row flex-wrap gap-1">
            {item.tags.map((tag) => (
              <TagChip key={tag.id} name={tag.name} color={tag.color} />
            ))}
          </View>
        )}
      </EditableSectionCard>

      <EntityMetaCard
        title={t('metadata')}
        description={t('metadataDescription')}
        createdLabel={t('created')}
        updatedLabel={t('updated')}
        referencesLabel={t('references')}
        referenceCount={item.referenceCount}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      />
    </DetailStack>
  )
}

function ServiceTimeFields({ item }: { item: CatalogItem }) {
  const { t } = useTranslation('services')
  const mode = item.timeMode
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
            item.durationMinutes != null
              ? t('durationValue', { count: item.durationMinutes })
              : t('noDescription')
          }
        />
      ) : null}
      {mode === 'window' ? (
        <>
          <ReadOnlyField label={t('startTime')} value={item.startTime ?? t('noDescription')} />
          <ReadOnlyField label={t('endTime')} value={item.endTime ?? t('noDescription')} />
        </>
      ) : null}
    </>
  )
}
