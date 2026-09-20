import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformHostedListFilterPanel } from '@webonone/platform-embed'
import { Alert, AlertDescription, FeaturePage, useToast } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'
import { websitePagesActions, websiteLayoutsActions } from '../store'
import { WebsiteHubListPage } from '../components/WebsiteHubListPage'
import { WebsiteHubListToolbar } from '../components/WebsiteHubListToolbar'
import { WebsiteHubTabs } from '../components/WebsiteHubTabs'
import { WebsitePageDialog } from '../components/WebsiteEntityDialogs'
import { WebsitePagesList } from '../components/WebsitePagesList'
import { WebsitePagesStatusFilterFields } from '../components/WebsitePagesStatusFilterFields'
import { useWebsiteLiveOrigin } from '../hooks/useWebsiteLiveOrigin'
import { websiteLiveUrl } from '../components/WebsiteHubTabs'
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
  const layouts = useAppSelector((s) => s.websiteLayouts.items)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.websitePages)
  usePlatformLoading(list.loading ? t('loading') : null)

  useEffect(() => {
    if (!accessToken) return
    dispatch(websiteLayoutsActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
  }, [accessToken, dispatch])

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
      return
    }
    setAwaitingCreate(true)
    dispatch(websitePagesActions.saveDetailRequested({ body: values }))
  }

  return (
    <FeaturePage title={t('title')} description={t('pagesDescription')} className="min-h-full">
      <WebsiteHubListPage
        section="pages"
        list={list}
        loading={list.loading}
        error={list.error}
        toolbar={
          <WebsiteHubListToolbar
            searchValue={list.q}
            onSearchChange={list.setQ}
            searchPlaceholder={t('searchPages')}
            searchAriaLabel={t('searchPages')}
            filterActive={list.hasActiveFilters}
            onFilterOpen={() => list.setFilterOpen(true)}
            filterAriaLabel={t('filterPages')}
            canManage={canManage}
            addLabel={t('addPage')}
            onAdd={() => setDialog({})}
            compactAddLabel={tc('add')}
          />
        }
        filterPanel={
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
        }
      >
        <WebsitePagesList
          pages={list.items as WebsitePage[]}
          canManage={canManage}
          onBrowse={(page) =>
            window.open(websiteLiveUrl(liveOrigin, page.companyId, page.path), '_blank', 'noopener')
          }
          onEditDetails={(page) =>
            setDialog({
              id: page.id,
              initial: {
                name: page.name,
                path: page.path,
                status: page.status,
                layoutId: page.layoutId,
              },
            })
          }
          onDeleted={(id) => {
            dispatch(websitePagesActions.deleteRequested({ id }))
            list.load(list.page, list.pageSize, true)
          }}
        />
      </WebsiteHubListPage>
      <WebsitePageDialog
        open={dialog !== null}
        initial={dialog?.initial}
        entityId={dialog?.id}
        layouts={layouts}
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
