import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, FeaturePage, LoadingState } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { TextLibraryAddDialog } from '../components/TextLibraryAddDialog'
import { TextLibraryItemEditor } from '../components/TextLibraryItemEditor'
import type { WebsiteElementEditorTab } from '../components/WebsiteElementEditorTabs'
import { WebsiteLibraryDetailPageMenu } from '../components/WebsiteLibraryDetailPageMenu'
import { websiteTextLibraryActions } from '../store'

export function WebsiteTextLibraryDetailPage() {
  const { itemId = '' } = useParams<{ itemId: string }>()
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { goToWebsite } = useNavigateDesign()
  const [editTab, setEditTab] = useState<WebsiteElementEditorTab | null>(null)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const library = useAppSelector((s) => s.websiteTextLibrary)

  const item = useMemo(
    () => library.items.find((entry) => entry.id === itemId) ?? null,
    [itemId, library.items],
  )

  const loading = library.listStatus === 'loading' && !item
  usePlatformLoading(loading ? t('loadingTextLibrary') : null)

  useEffect(() => {
    dispatch(
      websiteTextLibraryActions.loadListRequested({
        page: 1,
        pageSize: 48,
        force: true,
      }),
    )
  }, [dispatch, itemId])

  if (!accessToken) return <Navigate to="/login" replace />
  if (user?.role !== 'super_admin') {
    return (
      <FeaturePage title={t('textLibraryPageTitle')}>
        <Alert variant="destructive">
          <AlertDescription>{t('textLibrarySuperAdminOnly')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  const back = () => goToWebsite('/website/texts')

  if (!item && library.listStatus !== 'loading') {
    return (
      <FeaturePage title={t('editTextLibraryTitle')} onBack={back} backLabel={tc('back')}>
        <Alert variant="destructive">
          <AlertDescription>{t('textLibraryLoadFailed')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (!item) {
    return (
      <FeaturePage title={t('editTextLibraryTitle')} onBack={back} backLabel={tc('back')}>
        <LoadingState label={t('loadingTextLibrary')} />
      </FeaturePage>
    )
  }

  return (
    <FeaturePage
      title={item.name}
      description={t('editTextLibraryDescription')}
      onBack={back}
      backLabel={tc('back')}
      actions={
        <WebsiteLibraryDetailPageMenu
          kind="text"
          entityId={item.id}
          entityLabel={item.name}
          ariaLabel={t('actionsFor', { name: item.name })}
        />
      }
    >
      <TextLibraryItemEditor item={item} onEdit={setEditTab} />
      <TextLibraryAddDialog
        open={editTab !== null}
        item={item}
        initialTab={editTab ?? undefined}
        onOpenChange={(open) => {
          if (!open) setEditTab(null)
        }}
        onSaved={() =>
          dispatch(
            websiteTextLibraryActions.loadListRequested({
              page: 1,
              pageSize: 48,
              force: true,
            }),
          )
        }
      />
    </FeaturePage>
  )
}
