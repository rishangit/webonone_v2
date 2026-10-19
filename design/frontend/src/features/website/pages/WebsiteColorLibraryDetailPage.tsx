import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, FeaturePage, LoadingState } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { ColorLibraryAddDialog } from '../components/ColorLibraryAddDialog'
import {
  ColorLibraryItemEditor,
  type ColorLibraryEditSection,
} from '../components/ColorLibraryItemEditor'
import { websiteColorLibraryActions } from '../store'

export function WebsiteColorLibraryDetailPage() {
  const { itemId = '' } = useParams<{ itemId: string }>()
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { goToWebsite } = useNavigateDesign()
  const [editSection, setEditSection] = useState<ColorLibraryEditSection | null>(null)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const library = useAppSelector((s) => s.websiteColorLibrary)

  const item = useMemo(
    () => library.items.find((entry) => entry.id === itemId) ?? null,
    [itemId, library.items],
  )

  const loading = library.listStatus === 'loading' && !item
  usePlatformLoading(loading ? t('loadingColorLibrary') : null)

  useEffect(() => {
    dispatch(
      websiteColorLibraryActions.loadListRequested({
        page: 1,
        pageSize: 48,
        force: true,
      }),
    )
  }, [dispatch, itemId])

  if (!accessToken) return <Navigate to="/login" replace />
  if (user?.role !== 'super_admin') {
    return (
      <FeaturePage title={t('colorLibraryPageTitle')}>
        <Alert variant="destructive">
          <AlertDescription>{t('colorLibrarySuperAdminOnly')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  const back = () => goToWebsite('/website/colors')

  if (!item && library.listStatus !== 'loading') {
    return (
      <FeaturePage title={t('editColorPaletteLibraryTitle')} onBack={back} backLabel={tc('back')}>
        <Alert variant="destructive">
          <AlertDescription>{t('colorLibraryLoadFailed')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (!item) {
    return (
      <FeaturePage title={t('editColorPaletteLibraryTitle')} onBack={back} backLabel={tc('back')}>
        <LoadingState label={t('loadingColorLibrary')} />
      </FeaturePage>
    )
  }

  return (
    <FeaturePage
      title={item.name}
      description={t('editColorPaletteLibraryDescription')}
      onBack={back}
      backLabel={tc('back')}
    >
      <ColorLibraryItemEditor item={item} onEdit={setEditSection} />
      <ColorLibraryAddDialog
        open={editSection !== null}
        item={item}
        onOpenChange={(open) => {
          if (!open) setEditSection(null)
        }}
        onSaved={() =>
          dispatch(
            websiteColorLibraryActions.loadListRequested({
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
