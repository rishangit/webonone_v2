import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, FeaturePage, LoadingState } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { ButtonLibraryAddDialog } from '../components/ButtonLibraryAddDialog'
import { ButtonLibraryItemEditor } from '../components/ButtonLibraryItemEditor'
import type { WebsiteElementEditorTab } from '../components/WebsiteElementEditorTabs'
import { WebsiteLibraryDetailPageMenu } from '../components/WebsiteLibraryDetailPageMenu'
import { websiteButtonLibraryActions } from '../store'

export function WebsiteButtonLibraryDetailPage() {
  const { itemId = '' } = useParams<{ itemId: string }>()
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { goToWebsite } = useNavigateDesign()
  const [editTab, setEditTab] = useState<WebsiteElementEditorTab | null>(null)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const library = useAppSelector((s) => s.websiteButtonLibrary)

  const item = useMemo(
    () => library.items.find((entry) => entry.id === itemId) ?? null,
    [itemId, library.items],
  )

  const loading = library.listStatus === 'loading' && !item
  usePlatformLoading(loading ? t('loadingButtonLibrary') : null)

  useEffect(() => {
    dispatch(
      websiteButtonLibraryActions.loadListRequested({
        page: 1,
        pageSize: 48,
        force: true,
      }),
    )
  }, [dispatch, itemId])

  if (!accessToken) return <Navigate to="/login" replace />
  if (user?.role !== 'super_admin') {
    return (
      <FeaturePage title={t('buttonLibraryPageTitle')}>
        <Alert variant="destructive">
          <AlertDescription>{t('buttonLibrarySuperAdminOnly')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  const back = () => goToWebsite('/website/buttons')

  if (!item && library.listStatus !== 'loading') {
    return (
      <FeaturePage title={t('editButtonLibraryTitle')} onBack={back} backLabel={tc('back')}>
        <Alert variant="destructive">
          <AlertDescription>{t('buttonLibraryLoadFailed')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (!item) {
    return (
      <FeaturePage title={t('editButtonLibraryTitle')} onBack={back} backLabel={tc('back')}>
        <LoadingState label={t('loadingButtonLibrary')} />
      </FeaturePage>
    )
  }

  return (
    <FeaturePage
      title={item.name}
      description={t('editButtonLibraryDescription')}
      onBack={back}
      backLabel={tc('back')}
      actions={
        <WebsiteLibraryDetailPageMenu
          kind="button"
          entityId={item.id}
          entityLabel={item.name}
          ariaLabel={t('actionsFor', { name: item.name })}
        />
      }
    >
      <ButtonLibraryItemEditor item={item} onEdit={setEditTab} />
      <ButtonLibraryAddDialog
        open={editTab !== null}
        item={item}
        initialTab={editTab ?? undefined}
        onOpenChange={(open) => {
          if (!open) setEditTab(null)
        }}
        onSaved={() =>
          dispatch(
            websiteButtonLibraryActions.loadListRequested({
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
