import { useEffect, useMemo, useState } from 'react'
import { parseGoogleFontFamily } from '../utils/parseGoogleFontFamily'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, FeaturePage, LoadingState } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { fallbackTextSize } from '../document/theme'
import { ThemeTextStyleDialog } from '../components/theme-editor/ThemeTextStyleDialog'
import { ThemeTextStyleEditPanel } from '../components/theme-editor/ThemeTextStyleEditPanel'
import type { WebsiteElementEditorTab } from '../components/WebsiteElementEditorTabs'
import {
  WebsiteLibraryDownloadUpdateButton,
  WebsiteLibrarySourceTag,
} from '../components/WebsiteLibraryRevert'
import { useThemePersistence } from '../hooks/useThemePersistence'
import { useThemeTextLibraryDownload } from '../hooks/useThemeTextLibraryDownload'
import { websiteThemesActions } from '../store'
import { WEBSITE_BREAKPOINTS, type WebsiteBreakpoint, type WebsiteTextStyle, type WebsiteTheme } from '../types'
import { applyThemeTokenPatch } from '../utils/themeLibraryMaterialize'
import { upsertById } from '../utils/upsertById'
import { normalizeWebsiteElementCustomization } from '../utils/websiteElementCustomization'

function hydrateTextStyle(style: WebsiteTextStyle): WebsiteTextStyle {
  const sizeByBreakpoint = Object.fromEntries(
    WEBSITE_BREAKPOINTS.map((breakpoint) => [
      breakpoint,
      style.sizeByBreakpoint?.[breakpoint] ?? style.size ?? 16,
    ]),
  ) as NonNullable<WebsiteTextStyle['sizeByBreakpoint']>
  return {
    ...style,
    sizeByBreakpoint,
    size: fallbackTextSize(sizeByBreakpoint),
    customization: normalizeWebsiteElementCustomization(style.customization),
  }
}

export function WebsiteThemeTextStyleDetailPage() {
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
  const [previewBreakpoint, setPreviewBreakpoint] = useState<WebsiteBreakpoint>('lg')

  const { persistTheme, saving } = useThemePersistence(theme, setTheme)
  const download = useThemeTextLibraryDownload(theme, persistTheme)

  useEffect(() => {
    if (themeId) dispatch(websiteThemesActions.fetchDetailRequested({ id: themeId, force: true }))
  }, [dispatch, themeId])

  useEffect(() => {
    if (detail?.id === themeId) setTheme(detail)
  }, [detail, themeId])

  const style = useMemo(
    () => theme?.textStyles.find((entry) => entry.id === styleId) ?? null,
    [styleId, theme?.textStyles],
  )
  const values = useMemo(() => (style ? hydrateTextStyle(style) : null), [style])
  const fontUrls = useMemo(
    () =>
      (theme?.fonts ?? [])
        .map((font) => font.googleFontUrl)
        .filter((url) => Boolean(url) && parseGoogleFontFamily(url)),
    [theme?.fonts],
  )
  const canEdit = canManage && Boolean(theme)

  if (!accessToken) return <Navigate to="/login" replace />

  const backPath = `/website/themes/${themeId}`
  const back = () => goToWebsite(backPath)

  if (!theme) {
    return (
      <FeaturePage title={t('editTextStyleTitle')} onBack={back} backLabel={tc('back')}>
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
      <FeaturePage title={t('editTextStyleTitle')} onBack={back} backLabel={tc('back')}>
        <Alert variant="destructive">
          <AlertDescription>{t('themeTokenMissing')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage
      title={values.name || t('editTextStyleTitle')}
      description={t('editTextStyleDescription')}
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
      {fontUrls.map((url) => (
        <link key={url} rel="stylesheet" href={url} />
      ))}
      <WebsiteLibrarySourceTag sourceLibraryId={values.sourceLibraryId} />
      <ThemeTextStyleEditPanel
        theme={theme}
        values={values}
        onValuesChange={() => undefined}
        fieldErrors={{}}
        elementTab={elementTab}
        onElementTabChange={setElementTab}
        previewBreakpoint={previewBreakpoint}
        onPreviewBreakpointChange={setPreviewBreakpoint}
        layout="detail"
        mode="view"
        onEdit={canEdit ? setEditTab : undefined}
      />
      <ThemeTextStyleDialog
        open={editTab !== null}
        theme={theme}
        initial={values}
        initialTab={editTab ?? undefined}
        onOpenChange={(open) => {
          if (!open) setEditTab(null)
        }}
        onSubmit={(nextStyle, patch) => {
          const base = applyThemeTokenPatch(theme, patch)
          if (!persistTheme({ ...base, textStyles: upsertById(base.textStyles, nextStyle) })) {
            return
          }
          setEditTab(null)
        }}
      />
      {download.dialog}
    </FeaturePage>
  )
}
