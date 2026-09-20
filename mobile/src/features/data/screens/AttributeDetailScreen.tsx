import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Body,
  EditableSectionCard,
  FeatureScreen,
  ReadOnlyField,
  Spinner,
  useToast,
} from '@webonone/mobile-ui'
import { AttributeFormDialog } from '@/features/data/components/AttributeFormDialog'
import { DetailStack, EntityMetaCard } from '@/features/data/components/EntityMetaCard'
import { useDataPermissions } from '@/features/data/hooks/useDataPermissions'
import { attributeListPath } from '@/features/data/utils/dataPaths'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { Attribute } from '@/shared/types/data.types'

export function AttributeDetailScreen({ attributeId }: { attributeId: string }) {
  const { t } = useTranslation('attributes')
  const router = useRouter()
  const { toast } = useToast()
  const { canMutateReferenceData, canSetStatus } = useDataPermissions()
  const [attribute, setAttribute] = useState<Attribute | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAttribute(await dataAdminApi.getAttribute(attributeId))
    } catch (err) {
      setAttribute(null)
      setError(err instanceof Error ? err.message : 'Failed to load attribute')
    } finally {
      setLoading(false)
    }
  }, [attributeId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <FeatureScreen title={t('singular')} onBack={() => router.back()}>
        <Spinner label="Loading attribute…" />
      </FeatureScreen>
    )
  }

  if (!attribute) {
    return (
      <FeatureScreen title={t('singular')} onBack={() => router.back()}>
        <Body className="text-destructive">{error ?? 'Attribute not found.'}</Body>
      </FeatureScreen>
    )
  }

  return (
    <FeatureScreen
      title={attribute.name}
      description="Attribute details."
      onBack={() => router.push(attributeListPath())}
    >
      <DetailStack>
        <EditableSectionCard
          title={t('singular')}
          description="Name, value type, and unit."
          canEdit={canMutateReferenceData}
          onEdit={() => setEditOpen(true)}
        >
          <ReadOnlyField label="Name" value={attribute.name} />
          <ReadOnlyField label="Value type" value={attribute.valueType} />
          <ReadOnlyField
            label="Unit"
            value={attribute.unit ? `${attribute.unit.name} (${attribute.unit.symbol})` : '—'}
          />
          <ReadOnlyField
            label="Description"
            value={attribute.description?.trim() ? attribute.description : '—'}
          />
          <ReadOnlyField label="Status" value={attribute.status} />
        </EditableSectionCard>
        <EntityMetaCard
          referenceCount={attribute.referenceCount}
          createdAt={attribute.createdAt}
          updatedAt={attribute.updatedAt}
        />
      </DetailStack>

      {canMutateReferenceData ? (
        <AttributeFormDialog
          open={editOpen}
          attribute={attribute}
          canSetStatus={canSetStatus}
          onOpenChange={setEditOpen}
          onSaved={(saved) => {
            setAttribute(saved)
            toast({ title: 'Attribute saved' })
          }}
        />
      ) : null}
    </FeatureScreen>
  )
}
