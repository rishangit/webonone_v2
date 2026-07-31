import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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
import { useNavigateSms } from '@/features/shell/utils/navigateSms'
import { templatesActions } from '@/features/templates/store'

export function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { goToDetail, goToPreview } = useNavigateSms()
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
    if (!id) return
    dispatch(templatesActions.fetchDetailRequested({ id }))
    dispatch(templatesActions.loadVersionsRequested({ id }))
  }, [dispatch, id])

  useEffect(() => {
    if (restoringId && detailStatus === 'idle' && template) {
      setRestoringId(null)
      setSuccess('Version restored.')
      dispatch(templatesActions.loadVersionsRequested({ id: template.id, force: true }))
    }
  }, [detailStatus, dispatch, restoringId, template])

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
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => goToDetail(id)}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => goToPreview(id)}>
            Preview
          </Button>
        </div>
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
