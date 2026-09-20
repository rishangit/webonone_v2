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
import { TagFormDialog } from '@/features/data/components/TagFormDialog'
import { TagsList } from '@/features/data/components/TagsList'
import { useDataPermissions } from '@/features/data/hooks/useDataPermissions'
import { usePaginatedEntityList } from '@/features/data/hooks/usePaginatedEntityList'
import { tagDetailPath } from '@/features/data/utils/dataPaths'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { Tag } from '@/shared/types/data.types'

export function TagsListScreen() {
  const { t } = useTranslation('tags')
  const router = useRouter()
  const { toast } = useToast()
  const { canMutateReferenceData, canDelete, canSetStatus } = useDataPermissions()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  const list = usePaginatedEntityList((query) => dataAdminApi.listTags(query))
  const onScroll = useListPageScroll(list)

  async function handleVerify(tag: Tag) {
    setBusyId(tag.id)
    try {
      await dataAdminApi.updateTag(tag.id, { status: 'verified' })
      toast({ title: t('verified') })
      list.reload()
    } catch (err) {
      toast({
        title: t('deleteConfirmFallback'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(tag: Tag) {
    setBusyId(tag.id)
    try {
      await dataAdminApi.deleteTag(tag.id)
      toast({ title: t('singular') })
      list.reload()
    } catch (err) {
      toast({
        title: 'Failed to delete tag',
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
                setEditingTag(null)
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
          <TagsList
            items={list.items}
            busyId={busyId}
            canMutate={canMutateReferenceData}
            canDelete={canDelete}
            onOpen={(tag) => router.push(tagDetailPath(tag.id) as Href)}
            onEdit={(tag) => {
              setEditingTag(tag)
              setDialogOpen(true)
            }}
            onVerify={(tag) => void handleVerify(tag)}
            onDelete={(tag) => void handleDelete(tag)}
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
        <TagFormDialog
          open={dialogOpen}
          tag={editingTag}
          canSetStatus={canSetStatus}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditingTag(null)
          }}
          onSaved={(saved) => {
            list.reload()
            if (!editingTag) {
              router.push(tagDetailPath(saved.id) as Href)
            }
          }}
        />
      ) : null}
    </FeatureScreen>
  )
}
