import { useState } from 'react'
import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  FeatureScreen,
  ListAddButton,
  ListPageActions,
  ListPageBody,
  SearchInput,
  Spinner,
  useToast,
} from '@webonone/mobile-ui'
import { FormCreateDialog } from '@/features/design/components/FormCreateDialog'
import { FormsList } from '@/features/design/components/FormsList'
import { useDesignPermissions } from '@/features/design/hooks/useDesignPermissions'
import { formEditPath } from '@/features/design/utils/designPaths'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'
import { designAdminApi } from '@/shared/services/designAdminApi'
import type { FormTemplate } from '@/shared/types/design.types'

export function FormsListScreen() {
  const { t } = useTranslation('forms')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { toast } = useToast()
  const { canManage, hasCompany } = useDesignPermissions()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const list = useServerPaginatedList<FormTemplate>({
    fetchPage: async (query) => {
      if (!hasCompany) {
        return {
          items: [],
          total: 0,
          page: 1,
          pageSize: Number(query.pageSize ?? 12),
        }
      }
      const result = await designAdminApi.listForms({
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 12),
        q: typeof query.q === 'string' ? query.q : undefined,
      })
      return {
        items: result.items,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      }
    },
  })
  const onScroll = useListPageScroll(list)

  async function handleDelete(form: FormTemplate) {
    setBusyId(form.id)
    try {
      await designAdminApi.deleteForm(form.id)
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

  if (!hasCompany) {
    return (
      <FeatureScreen title={t('title')} description={t('description')}>
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeatureScreen>
    )
  }

  return (
    <FeatureScreen
      title={t('title')}
      description={t('description')}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            placeholder={t('searchPlaceholder')}
            value={list.searchQuery}
            onChangeText={list.setSearchQuery}
            onClear={list.searchQuery ? () => list.setSearchQuery('') : undefined}
            accessibilityLabel={t('searchPlaceholder')}
          />
          {canManage ? (
            <ListAddButton compactLabel={tc('add')} onPress={() => setDialogOpen(true)}>
              {t('add')}
            </ListAddButton>
          ) : null}
        </ListPageActions>
      }
    >
      {list.loading ? <Spinner label={t('loading')} /> : null}
      {list.error ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}

      {!list.loading ? (
        <ListPageBody>
          <FormsList
            items={list.items}
            canManage={canManage}
            busyId={busyId}
            onOpen={(form) => router.push(formEditPath(form.id) as Href)}
            onDelete={(form) => void handleDelete(form)}
          />
          <TranslatedListPageFooter
            loadedCount={list.items.length}
            totalCount={list.total}
            hasMore={list.hasMore}
            loadingMore={list.loadingMore}
          />
        </ListPageBody>
      ) : null}

      {canManage ? (
        <FormCreateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreated={(form) => router.push(formEditPath(form.id) as Href)}
        />
      ) : null}
    </FeatureScreen>
  )
}
