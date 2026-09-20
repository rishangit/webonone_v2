import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Body,
  EditableSectionCard,
  FeatureScreen,
  ReadOnlyField,
  Spinner,
  TagChip,
  useToast,
} from '@webonone/mobile-ui'
import { DetailStack, EntityMetaCard } from '@/features/data/components/EntityMetaCard'
import { TagFormDialog } from '@/features/data/components/TagFormDialog'
import { useDataPermissions } from '@/features/data/hooks/useDataPermissions'
import { tagListPath } from '@/features/data/utils/dataPaths'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { Tag } from '@/shared/types/data.types'

export function TagDetailScreen({ tagId }: { tagId: string }) {
  const { t } = useTranslation('tags')
  const router = useRouter()
  const { toast } = useToast()
  const { canMutateReferenceData, canSetStatus } = useDataPermissions()
  const [tag, setTag] = useState<Tag | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTag(await dataAdminApi.getTag(tagId))
    } catch (err) {
      setTag(null)
      setError(err instanceof Error ? err.message : 'Failed to load tag')
    } finally {
      setLoading(false)
    }
  }, [tagId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <FeatureScreen title={t('singular')} onBack={() => router.back()}>
        <Spinner label="Loading tag…" />
      </FeatureScreen>
    )
  }

  if (!tag) {
    return (
      <FeatureScreen title={t('singular')} onBack={() => router.back()}>
        <Body className="text-destructive">{error ?? 'Tag not found.'}</Body>
      </FeatureScreen>
    )
  }

  return (
    <FeatureScreen
      title={tag.name}
      description="Tag details."
      onBack={() => router.push(tagListPath())}
    >
      <DetailStack>
        <EditableSectionCard
          title={t('singular')}
          description="Name, color, status, and description."
          canEdit={canMutateReferenceData}
          onEdit={() => setEditOpen(true)}
        >
          <TagChip name={tag.name} color={tag.color} />
          <ReadOnlyField
            label="Description"
            value={tag.description?.trim() ? tag.description : '—'}
          />
          <ReadOnlyField label="Color" value={tag.color} />
          <ReadOnlyField label="Status" value={tag.status} />
        </EditableSectionCard>
        <EntityMetaCard
          referenceCount={tag.referenceCount}
          createdAt={tag.createdAt}
          updatedAt={tag.updatedAt}
        />
      </DetailStack>

      {canMutateReferenceData ? (
        <TagFormDialog
          open={editOpen}
          tag={tag}
          canSetStatus={canSetStatus}
          onOpenChange={setEditOpen}
          onSaved={(saved) => {
            setTag(saved)
            toast({ title: 'Tag saved' })
          }}
        />
      ) : null}
    </FeatureScreen>
  )
}
