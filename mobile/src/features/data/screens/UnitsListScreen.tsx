import { useState } from 'react'
import { useRouter, type Href } from 'expo-router'
import {
  Body,
  FeatureScreen,
  ListAddButton,
  ListPageActions,
  ListPageBody,
  SearchInput,
  Spinner,
  useToast,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { UnitFormDialog } from '@/features/data/components/UnitFormDialog'
import { UnitsList } from '@/features/data/components/UnitsList'
import { useDataPermissions } from '@/features/data/hooks/useDataPermissions'
import { usePaginatedEntityList } from '@/features/data/hooks/usePaginatedEntityList'
import { unitDetailPath } from '@/features/data/utils/dataPaths'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { Unit } from '@/shared/types/data.types'

export function UnitsListScreen() {
  const { t } = useTranslation('units')
  const router = useRouter()
  const { toast } = useToast()
  const { canMutateReferenceData, canDelete, canSetStatus } = useDataPermissions()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)

  const list = usePaginatedEntityList((query) => dataAdminApi.listUnits(query))
  const onScroll = useListPageScroll(list)

  async function handleVerify(unit: Unit) {
    setBusyId(unit.id)
    try {
      await dataAdminApi.updateUnit(unit.id, { status: 'verified' })
      toast({ title: t('verified') })
      list.reload()
    } catch (err) {
      toast({
        title: 'Failed to verify unit',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(unit: Unit) {
    setBusyId(unit.id)
    try {
      await dataAdminApi.deleteUnit(unit.id)
      toast({ title: t('singular') })
      list.reload()
    } catch (err) {
      toast({
        title: 'Failed to delete unit',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <FeatureScreen
      title={t('title')}
      description={t('description')}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            placeholder={t('search')}
            value={list.searchQuery}
            onChangeText={list.setSearchQuery}
            onClear={list.searchQuery ? () => list.setSearchQuery('') : undefined}
            accessibilityLabel={t('search')}
          />
          {canMutateReferenceData ? (
            <ListAddButton
              onPress={() => {
                setEditingUnit(null)
                setDialogOpen(true)
              }}
            >
              {t('add')}
            </ListAddButton>
          ) : null}
        </ListPageActions>
      }
    >
      {list.loading ? <Spinner label={t('loading')} /> : null}
      {list.error ? <Body className="text-destructive">{list.error}</Body> : null}

      {!list.loading ? (
        <ListPageBody>
          <UnitsList
            items={list.items}
            busyId={busyId}
            canMutate={canMutateReferenceData}
            canDelete={canDelete}
            onOpen={(unit) => router.push(unitDetailPath(unit.id) as Href)}
            onEdit={(unit) => {
              setEditingUnit(unit)
              setDialogOpen(true)
            }}
            onVerify={(unit) => void handleVerify(unit)}
            onDelete={(unit) => void handleDelete(unit)}
          />
          <TranslatedListPageFooter
            loadedCount={list.items.length}
            totalCount={list.total}
            hasMore={list.hasMore}
            loadingMore={list.loadingMore}
          />
        </ListPageBody>
      ) : null}

      {canMutateReferenceData ? (
        <UnitFormDialog
          open={dialogOpen}
          unit={editingUnit}
          canSetStatus={canSetStatus}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditingUnit(null)
          }}
          onSaved={(saved) => {
            list.reload()
            if (!editingUnit) {
              router.push(unitDetailPath(saved.id) as Href)
            }
          }}
        />
      ) : null}
    </FeatureScreen>
  )
}
