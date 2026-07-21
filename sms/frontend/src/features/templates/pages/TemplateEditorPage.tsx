import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
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
  Pagination,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { templatesActions } from '@/features/templates/store'

export function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((s) => s.auth)
  const { detail: template, detailStatus, detailError, versions, versionsStatus } = useAppSelector(
    (s) => s.templates,
  )
  const [success, setSuccess] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [versionPage, setVersionPage] = useState(1)
  const [versionPageSize, setVersionPageSize] = useState(12)

  const loading = detailStatus === 'loading' && !template
  const versionsLoading = versionsStatus === 'loading' && versions.length === 0

  usePlatformLoading(loading ? 'Loading template…' : versionsLoading ? 'Loading versions…' : null)

  const visibleVersions = versions.slice(
    (versionPage - 1) * versionPageSize,
    versionPage * versionPageSize,
  )

  useEffect(() => {
    if (!id || !accessToken) return
    dispatch(templatesActions.fetchDetailRequested({ id }))
    dispatch(templatesActions.loadVersionsRequested({ id }))
  }, [accessToken, dispatch, id])

  useEffect(() => {
    if (restoringId && detailStatus === 'idle' && template) {
      setRestoringId(null)
      setSuccess('Version restored.')
      dispatch(templatesActions.loadVersionsRequested({ id: template.id, force: true }))
    }
  }, [detailStatus, dispatch, restoringId, template])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  function handleRestoreVersion(versionId: string) {
    if (!id) return
    setRestoringId(versionId)
    setSuccess(null)
    dispatch(templatesActions.restoreVersionRequested({ id, versionId }))
  }

  if (!id) {
    return (
      <FeaturePage title="Version history" description="Missing template id.">
        <Button type="button" variant="outline" onClick={() => navigate('/templates')}>
          Back to templates
        </Button>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage
      title={template ? `Versions: ${template.name}` : 'Version history'}
      description="Restore a previous version of this template."
      actions={
        <Button type="button" variant="outline" asChild>
          <Link to="/templates">Back</Link>
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
              <ItemListEmpty>No versions yet.</ItemListEmpty>
            ) : (
              <ItemList>
                {visibleVersions.map((version) => (
                  <ItemListItem key={version.id}>
                    <ItemListContent>
                      <p className="font-medium">v{version.versionNumber}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{version.body}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(version.createdAt).toLocaleString()}
                      </p>
                    </ItemListContent>
                    <ItemListMenu ariaLabel={`Actions for version ${version.versionNumber}`}>
                      <DropdownMenuItem
                        disabled={restoringId === version.id || detailStatus === 'saving'}
                        onClick={() => handleRestoreVersion(version.id)}
                      >
                        Restore
                      </DropdownMenuItem>
                    </ItemListMenu>
                  </ItemListItem>
                ))}
              </ItemList>
            )}
          </div>
          {versions.length > 0 ? (
            <Pagination
              className="mt-auto"
              totalCount={versions.length}
              currentPage={versionPage}
              pageSize={versionPageSize}
              pageSizeOptions={[12, 24, 48]}
              onPageChange={setVersionPage}
              onPageSizeChange={(nextSize) => {
                setVersionPageSize(nextSize)
                setVersionPage(1)
              }}
            />
          ) : null}
        </ListPageBody>
      ) : null}
    </FeaturePage>
  )
}
