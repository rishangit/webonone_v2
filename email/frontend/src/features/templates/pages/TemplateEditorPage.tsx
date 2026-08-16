import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  DropdownMenuItem,
  FeaturePage,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ListPageBody,
  ListPageFooter,
  useClientListPage,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { templatesActions } from '@/features/templates/store'

export function TemplateEditorPage() {
  const { t } = useTranslation('templates')
  const { t: tc } = useTranslation('common')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const {
    detail: template,
    detailStatus,
    detailError,
    versions,
    versionsStatus,
  } = useAppSelector((s) => s.templates)
  const [success, setSuccess] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const versionList = useClientListPage(versions)
  const visibleVersions = versionList.visible

  const loading = detailStatus === 'loading' && !template
  const versionsLoading = versionsStatus === 'loading' && versions.length === 0

  usePlatformLoading(
    loading ? t('loadingTemplate') : versionsLoading ? t('versions.loading') : null,
  )

  useEffect(() => {
    if (!id) return
    dispatch(templatesActions.fetchDetailRequested({ id }))
    dispatch(templatesActions.loadVersionsRequested({ id }))
  }, [dispatch, id])

  useEffect(() => {
    if (restoringId && detailStatus === 'idle' && template) {
      setRestoringId(null)
      setSuccess(t('versions.restored'))
      dispatch(templatesActions.loadVersionsRequested({ id: template.id, force: true }))
    }
  }, [detailStatus, dispatch, restoringId, t, template])

  function handleRestoreVersion(versionId: string) {
    if (!id) return
    setRestoringId(versionId)
    setSuccess(null)
    dispatch(templatesActions.restoreVersionRequested({ id, versionId }))
  }

  if (!id) {
    return (
      <FeaturePage title={t('versions.pageTitleFallback')} description={t('versions.missingId')}>
        <Button type="button" variant="outline" onClick={() => navigate('/templates')}>
          {t('versions.backToTemplates')}
        </Button>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage
      title={
        template ? t('versions.pageTitle', { name: template.name }) : t('versions.pageTitleFallback')
      }
      description={t('versions.pageDescription')}
      onBack={() => navigate(`/templates/${id}`)}
      backLabel={tc('back')}
      actions={
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to={`/templates/${id}/preview`}>{t('preview')}</Link>
        </Button>
      }
    >
      {detailError ? (
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}
      {!loading ? (
        <ListPageBody>
          <div className="flex-1">
            {versions.length === 0 ? (
              <ItemListEmpty>{t('versions.empty')}</ItemListEmpty>
            ) : (
              <ItemList>
                {visibleVersions.map((version) => (
                  <ItemListItem key={version.id}>
                    <ItemListContent>
                      <p className="font-medium">v{version.versionNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {version.subject} · {new Date(version.createdAt).toLocaleString()}
                      </p>
                    </ItemListContent>
                    <ItemListMenu ariaLabel={t('versions.actionsFor', { number: version.versionNumber })}>
                      <DropdownMenuItem
                        disabled={restoringId === version.id || detailStatus === 'saving'}
                        onClick={() => handleRestoreVersion(version.id)}
                      >
                        {t('versions.restore')}
                      </DropdownMenuItem>
                    </ItemListMenu>
                  </ItemListItem>
                ))}
              </ItemList>
            )}
          </div>
          {versions.length > 0 ? (
            <ListPageFooter
              className="mt-auto"
              totalCount={versionList.total}
              currentPage={versionList.page}
              pageSize={versionList.pageSize}
              pageSizeOptions={[12, 24, 48]}
              loadedCount={versionList.loadedCount}
              hasMore={versionList.hasMore}
              onPageChange={versionList.setPage}
              onPageSizeChange={versionList.setPageSize}
              onLoadMore={versionList.loadMore}
            />
          ) : null}
        </ListPageBody>
      ) : null}
    </FeaturePage>
  )
}
