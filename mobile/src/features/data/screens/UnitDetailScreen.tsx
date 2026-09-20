import { useCallback, useEffect, useState } from 'react'
import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Body,
  EditableSectionCard,
  FeatureScreen,
  ReadOnlyField,
  Spinner,
  useToast,
} from '@webonone/mobile-ui'
import { DetailStack, EntityMetaCard } from '@/features/data/components/EntityMetaCard'
import { UnitFormDialog } from '@/features/data/components/UnitFormDialog'
import { useDataPermissions } from '@/features/data/hooks/useDataPermissions'
import { unitListPath } from '@/features/data/utils/dataPaths'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { Unit } from '@/shared/types/data.types'

export function UnitDetailScreen({ unitId }: { unitId: string }) {
  const { t } = useTranslation('units')
  const router = useRouter()
  const { toast } = useToast()
  const { canMutateReferenceData, canSetStatus } = useDataPermissions()
  const [unit, setUnit] = useState<Unit | null>(null)
  const [baseUnit, setBaseUnit] = useState<Unit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const loaded = await dataAdminApi.getUnit(unitId)
      setUnit(loaded)
      if (loaded.baseUnitId) {
        setBaseUnit(await dataAdminApi.getUnit(loaded.baseUnitId))
      } else {
        setBaseUnit(null)
      }
    } catch (err) {
      setUnit(null)
      setError(err instanceof Error ? err.message : 'Failed to load unit')
    } finally {
      setLoading(false)
    }
  }, [unitId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <FeatureScreen title={t('singular')} onBack={() => router.back()}>
        <Spinner label="Loading unit…" />
      </FeatureScreen>
    )
  }

  if (!unit) {
    return (
      <FeatureScreen title={t('singular')} onBack={() => router.back()}>
        <Body className="text-destructive">{error ?? 'Unit not found.'}</Body>
      </FeatureScreen>
    )
  }

  return (
    <FeatureScreen title={unit.name} description="Unit details." onBack={() => router.push(unitListPath())}>
      <DetailStack>
        <EditableSectionCard
          title={t('singular')}
          description="Name, symbol, and base unit."
          canEdit={canMutateReferenceData}
          onEdit={() => setEditOpen(true)}
        >
          <ReadOnlyField label="Name" value={unit.name} />
          <ReadOnlyField label="Symbol" value={unit.symbol} />
          <ReadOnlyField
            label="Description"
            value={unit.description?.trim() ? unit.description : '—'}
          />
          <ReadOnlyField label="Base unit" value={unit.isBase ? 'Yes' : 'No'} />
          {!unit.isBase && baseUnit ? (
            <ReadOnlyField
              label="Linked base unit"
              value={`${baseUnit.name} (${baseUnit.symbol})`}
            />
          ) : null}
          <ReadOnlyField label="Status" value={unit.status} />
        </EditableSectionCard>
        <EntityMetaCard
          referenceCount={unit.referenceCount}
          createdAt={unit.createdAt}
          updatedAt={unit.updatedAt}
        />
      </DetailStack>

      {canMutateReferenceData ? (
        <UnitFormDialog
          open={editOpen}
          unit={unit}
          canSetStatus={canSetStatus}
          onOpenChange={setEditOpen}
          onSaved={(saved) => {
            setUnit(saved)
            toast({ title: 'Unit saved' })
            void load()
          }}
        />
      ) : null}
    </FeatureScreen>
  )
}
