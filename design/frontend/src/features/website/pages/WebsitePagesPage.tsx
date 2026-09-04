import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformHostedListFilterPanel } from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  ListAddButton,
  ListFilterTrigger,
  ListPageBody,
  ListPageFooter,
  SearchInput,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'
import { websitePagesActions } from '../store'
import { WebsiteHubTabs, websiteLiveUrl } from '../components/WebsiteHubTabs'
import { WebsitePageDialog } from '../components/WebsiteEntityDialogs'
import { WebsitePagesList } from '../components/WebsitePagesList'
import { WebsitePagesStatusFilterFields } from '../components/WebsitePagesStatusFilterFields'
import { useWebsiteLiveOrigin } from '../hooks/useWebsiteLiveOrigin'
import type { WebsitePagesFilterDraft } from './WebsitePagesFilterEmbedPage'
import type { PageMetaValues } from '../schemas/websiteMeta'
import type { WebsitePage } from '../types'

export function WebsitePagesPage() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { goToWebsiteEdit } = useNavigateDesign()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const canManage = user?.role === 'super_admin' || user?.role === 'company_admin'
  const companyId = user?.companyId ?? null
  const liveOrigin = useWebsiteLiveOrigin(Boolean(accessToken && companyId))
  const [dialog, setDialog] = useState<{ initial?: PageMetaValues; id?: string } | null>(null)
  const [awaitingCreate, setAwaitingCreate] = useState(false)

  const list = useEpicCatalogList((s) => s.websitePages, websitePagesActions)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.websitePages)
  usePlatformLoading(list.loading ? t('loading') : null)

  useEffect(() => {
    if (!awaitingCreate) return
    if (detailStatus === 'idle' && detail) {
      setAwaitingCreate(false)
      setDialog(null)
      toast({ title: t('created') })
      goToWebsiteEdit('pages', detail.id)
    }
    if (detailStatus === 'error') setAwaitingCreate(false)
  }, [awaitingCreate, detail, detailStatus, goToWebsiteEdit, t, toast])

  if (!accessToken) return <Navigate to="/login" replace />
  if (!companyId) {
    return (
      <FeaturePage title={t('title')} description={t('description')}>
        <WebsiteHubTabs section="pages" />
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  function handleCreate(values: PageMetaValues) {
    if (dialog?.id) {
      dispatch(websitePagesActions.saveDetailRequested({ id: dialog.id, body: values }))
      setDialog(null)
      toast({ title: t('saved') })
      list.load(1, list.pageSize, true)
      return
    }
    setAwaitingCreate(true)
    dispatch(websitePagesActions.saveDetailRequested({ body: values }))
  }

  return (
    <FeaturePage title={t('title')} description={t('pagesDescription')}>
      <WebsiteHubTabs
        section="pages"
        actions={
          <>
            <SearchInput
              value={list.q}
              onChange={(event) => list.setQ(event.target.value)}
              placeholder={t('searchPages')}
              className="w-64"
              aria-label={t('searchPages')}
            />
            <ListFilterTrigger active={list.hasActiveFilters} onClick={() => list.setFilterOpen(true)} />
            {canManage ? (
              <ListAddButton onClick={() => setDialog({})} compactLabel={tc('add')}>
                {t('addPage')}
              </ListAddButton>
            ) : null}
          </>
        }
      />
      <PlatformHostedListFilterPanel<WebsitePagesFilterDraft>
        path="/embed/panels/website/pages/filters"
        open={list.filterOpen}
        onOpenChange={list.setFilterOpen}
        draft={{ status: list.status }}
        onDraftApply={(draft) => list.setStatus(draft.status)}
        onApply={(draft) => {
          const nextStatus = draft?.status ?? list.status
          if (draft) list.setStatus(nextStatus)
          list.load(1, list.pageSize, true, { status: nextStatus })
        }}
        onClear={() => {
          list.setStatus('all')
          list.load(1, list.pageSize, true, { status: 'all' })
        }}
        isAllowedParentOrigin={isAllowedParentOrigin}
      >
        <WebsitePagesStatusFilterFields value={list.status} onChange={list.setStatus} />
      </PlatformHostedListFilterPanel>
      {list.error ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}
      <ListPageBody>
        <div className="flex-1">
          <WebsitePagesList
            pages={list.items as WebsitePage[]}
            canManage={canManage}
            onBrowse={(page) => window.open(websiteLiveUrl(liveOrigin, page.companyId, page.path), '_blank', 'noopener')}
            onEditDetails={(page) =>
              setDialog({ id: page.id, initial: { name: page.name, path: page.path, status: page.status } })
            }
            onDeleted={(id) => {
              dispatch(websitePagesActions.deleteRequested({ id }))
              list.load(list.page, list.pageSize, true)
            }}
          />
        </div>
        <ListPageFooter
          className="mt-auto"
          currentPage={list.page}
          pageSize={list.pageSize}
          totalCount={list.total}
          loadedCount={list.items.length}
          hasMore={list.items.length < list.total}
          loadingMore={list.loadingMore}
          onPageChange={(next) => list.load(next, list.pageSize, true)}
          onPageSizeChange={(next) => list.load(1, next, true)}
          onLoadMore={() => list.loadMore()}
          onModeChange={() => list.load(1, list.pageSize, true)}
        />
      </ListPageBody>
      <WebsitePageDialog
        open={dialog !== null}
        initial={dialog?.initial}
        entityId={dialog?.id}
        isSaving={detailStatus === 'saving'}
        error={awaitingCreate ? detailError : null}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        onSubmit={handleCreate}
        onHostedSaved={() => list.load(1, list.pageSize, true)}
      />
    </FeaturePage>
  )
}
