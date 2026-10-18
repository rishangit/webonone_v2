import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, FeaturePage, LoadingState } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { ThemeButtonStyleDialog } from '../components/theme-editor/ThemeButtonStyleDialog'
import { ThemeButtonStyleEditPanel } from '../components/theme-editor/ThemeButtonStyleEditPanel'
import type { WebsiteElementEditorTab } from '../components/WebsiteElementEditorTabs'
import {
  WebsiteLibraryDownloadUpdateButton,
  WebsiteLibrarySourceTag,
} from '../components/WebsiteLibraryRevert'
import { useThemeButtonLibraryDownload } from '../hooks/useThemeButtonLibraryDownload'
import { useThemePersistence } from '../hooks/useThemePersistence'
import { websiteThemesActions } from '../store'
import type { WebsiteButtonStyle, WebsiteTheme } from '../types'
import { applyThemeTokenPatch } from '../utils/themeLibraryMaterialize'
import { upsertById } from '../utils/upsertById'
import { normalizeWebsiteElementCustomization } from '../utils/websiteElementCustomization'

function hydrateButtonStyle(style: WebsiteButtonStyle): WebsiteButtonStyle {
  return {
    ...style,
    customization: normalizeWebsiteElementCustomization(style.customization),
  }
}

export function WebsiteThemeButtonStyleDetailPage() {
  const { themeId = '', styleId = '' } = useParams<{ themeId: string; styleId: string }>()
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { goToWebsite } = useNavigateDesign()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const canManage = user?.role === 'super_admin' || user?.role === 'company_admin'
  const { detail, detailStatus } = useAppSelector((s) => s.websiteThemes)
  const [theme, setTheme] = useState<WebsiteTheme | null>(null)
  const [elementTab, setElementTab] = useState<WebsiteElementEditorTab>('general')
  const [editTab, setEditTab] = useState<WebsiteElementEditorTab | null>(null)

  const { persistTheme, saving } = useThemePersistence(theme, setTheme)
  const download = useThemeButtonLibraryDownload(theme, persistTheme)

  useEffect(() => {
    if (themeId) dispatch(websiteThemesActions.fetchDetailRequested({ id: themeId, force: true }))
  }, [dispatch, themeId])

  useEffect(() => {
    if (detail?.id === themeId) setTheme(detail)
  }, [detail, themeId])

  const style = useMemo(
    () => theme?.buttonStyles.find((entry) => entry.id === styleId) ?? null,
    [styleId, theme?.buttonStyles],
  )
  const values = useMemo(() => (style ? hydrateButtonStyle(style) : null), [style])
  const canEdit = canManage && Boolean(theme) && !theme?.isLocked

  if (!accessToken) return <Navigate to="/login" replace />

  const backPath = `/website/themes/${themeId}`
  const back = () => goToWebsite(backPath)

  if (!theme) {
    return (
      <FeaturePage title={t('editButtonStyleTitle')} onBack={back} backLabel={tc('back')}>
        {detailStatus === 'error' ? (
          <Alert variant="destructive">
            <AlertDescription>{t('loading')}</AlertDescription>
          </Alert>
        ) : (
          <LoadingState label={t('loading')} />
        )}
      </FeaturePage>
    )
  }

  if (!style || !values) {
    return (
      <FeaturePage title={t('editButtonStyleTitle')} onBack={back} backLabel={tc('back')}>
        <Alert variant="destructive">
          <AlertDescription>{t('themeTokenMissing')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage
      title={values.name || t('editButtonStyleTitle')}
      description={t('editButtonStyleDescription')}
      onBack={back}
      backLabel={tc('back')}
      actions={
        canEdit && values.sourceLibraryId ? (
          <WebsiteLibraryDownloadUpdateButton
            disabled={saving || download.downloading}
            onClick={() => download.ask(values)}
          />
        ) : null
      }
    >
      {theme.isLocked ? (
        <Alert>
          <AlertDescription>{t('defaultLocked')}</AlertDescription>
        </Alert>
      ) : (
        <WebsiteLibrarySourceTag sourceLibraryId={values.sourceLibraryId} />
      )}
      <ThemeButtonStyleEditPanel
        theme={theme}
        values={values}
        onValuesChange={() => undefined}
        fieldErrors={{}}
        elementTab={elementTab}
        onElementTabChange={setElementTab}
        layout="detail"
        mode="view"
        onEdit={canEdit ? setEditTab : undefined}
      />
      <ThemeButtonStyleDialog
        open={editTab !== null}
        theme={theme}
        initial={values}
        initialTab={editTab ?? undefined}
        onOpenChange={(open) => {
          if (!open) setEditTab(null)
        }}
        onSubmit={(nextStyle, patch) => {
          const base = applyThemeTokenPatch(theme, patch)
          persistTheme({ ...base, buttonStyles: upsertById(base.buttonStyles, nextStyle) })
          setEditTab(null)
        }}
      />
      {download.dialog}
    </FeaturePage>
  )
}
