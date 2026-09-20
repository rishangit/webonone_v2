import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, type Href } from 'expo-router'
import {
  Body,
  FeatureScreen,
  ListAddButton,
  ListPageActions,
  ListPageBody,
  SearchInput,
  Spinner,
} from '@webonone/mobile-ui'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { useTranslation } from 'react-i18next'
import { TemplateFormDialog } from '@/features/sms/components/TemplateFormDialog'
import { TemplatesList } from '@/features/sms/components/TemplatesList'
import {
  templateDetailPath,
  templatePreviewPath,
  templateVersionsPath,
} from '@/features/sms/utils/templatePaths'
import { useSession } from '@/features/auth/SessionContext'
import { smsAdminApi, type SmsAdminTemplate } from '@/shared/services/smsAdminApi'
import { useClientInfiniteList } from '@/shared/hooks/useClientInfiniteList'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'

type DialogMode = 'create' | 'edit'

export function TemplatesScreen() {
  const { t } = useTranslation('smsTemplates')
  const router = useRouter()
  const { user } = useSession()
  const canManage = user?.role === 'super_admin' || user?.role === 'company_admin'

  const [items, setItems] = useState<SmsAdminTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>('create')
  const [editingTemplate, setEditingTemplate] = useState<SmsAdminTemplate | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await smsAdminApi.listTemplates())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const query = searchQuery.trim().toLowerCase()
  const filteredTemplates = useMemo(() => {
    if (!query) return items
    return items.filter(
      (template) =>
        template.name.toLowerCase().includes(query) || template.slug.toLowerCase().includes(query),
    )
  }, [items, query])

  const pagination = useClientInfiniteList(filteredTemplates, 12, query)
  const onScroll = useListPageScroll(pagination)

  function openCreate() {
    setDialogMode('create')
    setEditingTemplate(null)
    setDialogOpen(true)
  }

  function openEdit(template: SmsAdminTemplate) {
    setDialogMode('edit')
    setEditingTemplate(template)
    setDialogOpen(true)
  }

  async function handleToggleActive(template: SmsAdminTemplate) {
    setBusyId(template.id)
    try {
      await smsAdminApi.setTemplateActive(template.id, !template.isActive)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(template: SmsAdminTemplate) {
    setBusyId(template.id)
    try {
      await smsAdminApi.deleteTemplate(template.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
    } finally {
      setBusyId(null)
    }
  }

  function handleSaved(saved: SmsAdminTemplate) {
    void load()
    if (dialogMode === 'create') {
      router.push(templateDetailPath(saved.id) as Href)
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
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={searchQuery ? () => setSearchQuery('') : undefined}
            accessibilityLabel={t('searchAria')}
          />
          {canManage ? <ListAddButton onPress={openCreate}>{t('add')}</ListAddButton> : null}
        </ListPageActions>
      }
    >
      {loading ? <Spinner label={t('loading')} /> : null}
      {error ? <Body className="text-destructive">{error}</Body> : null}
      {!loading ? (
        <ListPageBody>
          <TemplatesList
            templates={pagination.visibleItems}
            busyId={busyId}
            canDelete={canManage}
            onOpen={(template) => router.push(templateDetailPath(template.id) as Href)}
            onEdit={openEdit}
            onPreview={(template) => router.push(templatePreviewPath(template.id) as Href)}
            onToggleActive={(template) => void handleToggleActive(template)}
            onVersions={(template) => router.push(templateVersionsPath(template.id) as Href)}
            onDelete={(template) => void handleDelete(template)}
          />
          <TranslatedListPageFooter
            loadedCount={pagination.loadedCount}
            totalCount={pagination.totalCount}
            hasMore={pagination.hasMore}
            loadingMore={pagination.loadingMore}
          />
        </ListPageBody>
      ) : null}

      {canManage ? (
        <TemplateFormDialog
          open={dialogOpen}
          mode={dialogMode}
          template={editingTemplate}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditingTemplate(null)
          }}
          onSaved={handleSaved}
        />
      ) : null}
    </FeatureScreen>
  )
}
