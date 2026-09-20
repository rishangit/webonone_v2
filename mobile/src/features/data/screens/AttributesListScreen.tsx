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
import { AttributesList } from '@/features/data/components/AttributesList'
import { AttributeFormDialog } from '@/features/data/components/AttributeFormDialog'
import { useDataPermissions } from '@/features/data/hooks/useDataPermissions'
import { usePaginatedEntityList } from '@/features/data/hooks/usePaginatedEntityList'
import { attributeDetailPath } from '@/features/data/utils/dataPaths'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { Attribute } from '@/shared/types/data.types'

export function AttributesListScreen() {
  const { t } = useTranslation('attributes')
  const router = useRouter()
  const { toast } = useToast()
  const { canMutateReferenceData, canDelete, canSetStatus } = useDataPermissions()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null)

  const list = usePaginatedEntityList((query) => dataAdminApi.listAttributes(query))
  const onScroll = useListPageScroll(list)

  async function handleVerify(attribute: Attribute) {
    setBusyId(attribute.id)
    try {
      await dataAdminApi.updateAttribute(attribute.id, { status: 'verified' })
      toast({ title: t('verified') })
      list.reload()
    } catch (err) {
      toast({
        title: 'Failed to verify attribute',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(attribute: Attribute) {
    setBusyId(attribute.id)
    try {
      await dataAdminApi.deleteAttribute(attribute.id)
      toast({ title: t('singular') })
      list.reload()
    } catch (err) {
      toast({
        title: 'Failed to delete attribute',
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
                setEditingAttribute(null)
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
          <AttributesList
            items={list.items}
            busyId={busyId}
            canMutate={canMutateReferenceData}
            canDelete={canDelete}
            onOpen={(attribute) => router.push(attributeDetailPath(attribute.id) as Href)}
            onEdit={(attribute) => {
              setEditingAttribute(attribute)
              setDialogOpen(true)
            }}
            onVerify={(attribute) => void handleVerify(attribute)}
            onDelete={(attribute) => void handleDelete(attribute)}
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
        <AttributeFormDialog
          open={dialogOpen}
          attribute={editingAttribute}
          canSetStatus={canSetStatus}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditingAttribute(null)
          }}
          onSaved={(saved) => {
            list.reload()
            if (!editingAttribute) {
              router.push(attributeDetailPath(saved.id) as Href)
            }
          }}
        />
      ) : null}
    </FeatureScreen>
  )
}
