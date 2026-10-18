import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import { Alert, AlertDescription, Button, FeaturePage, useToast } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { fallbackTextSize, resolveTextStyle } from '../document/theme'
import { ThemeTextStyleEditPanel } from '../components/theme-editor/ThemeTextStyleEditPanel'
import type { WebsiteElementEditorTab } from '../components/WebsiteElementEditorTabs'
import {
  WebsiteLibraryDownloadUpdateButton,
  WebsiteLibrarySourceTag,
} from '../components/WebsiteLibraryRevert'
import { useThemePersistence } from '../hooks/useThemePersistence'
import { useThemeTextLibraryDownload } from '../hooks/useThemeTextLibraryDownload'
import { websiteTextStyleSchema } from '../schemas/websiteThemeSchemas'
import { websiteThemesActions } from '../store'
import { WEBSITE_BREAKPOINTS, type WebsiteBreakpoint, type WebsiteTextStyle, type WebsiteTheme } from '../types'
import {
  defaultElementHtml,
  finalizeElementCustomization,
  hasElementCustomization,
  normalizeWebsiteElementCustomization,
} from '../utils/websiteElementCustomization'
import { mapThemeFieldErrors } from '../utils/mapThemeFieldErrors'
import { upsertById } from '../utils/upsertById'

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
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const { goToWebsite } = useNavigateDesign()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const canManage = user?.role === 'super_admin' || user?.role === 'company_admin'
  const { detail, detailStatus } = useAppSelector((s) => s.websiteThemes)
  const [theme, setTheme] = useState<WebsiteTheme | null>(null)
  const [values, setValues] = useState<WebsiteTextStyle | null>(null)
  const [elementTab, setElementTab] = useState<WebsiteElementEditorTab>('preview')
  const [previewBreakpoint, setPreviewBreakpoint] = useState<WebsiteBreakpoint>('lg')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { persistTheme, saving } = useThemePersistence(theme, setTheme)
  const download = useThemeTextLibraryDownload(theme, persistTheme)

  useEffect(() => {
    if (themeId) dispatch(websiteThemesActions.fetchDetailRequested({ id: themeId, force: true }))
  }, [dispatch, themeId])

  useEffect(() => {
    if (detail?.id === themeId) setTheme(detail)
  }, [detail, themeId])

  const initialStyle = useMemo(
    () => theme?.textStyles.find((style) => style.id === styleId) ?? null,
    [styleId, theme?.textStyles],
  )

  useEffect(() => {
    if (initialStyle) setValues(hydrateTextStyle(initialStyle))
  }, [initialStyle])

  if (!accessToken) return <Navigate to="/login" replace />

  const backPath = `/website/themes/${themeId}`

  if (!theme || !values) {
    return (
      <FeaturePage title={t('editTextStyleTitle')} onBack={() => goToWebsite(backPath)}>
        {detailStatus === 'error' ? (
          <Alert variant="destructive">
            <AlertDescription>{t('loading')}</AlertDescription>
          </Alert>
        ) : null}
      </FeaturePage>
    )
  }

  if (!initialStyle) {
    return (
      <FeaturePage title={t('editTextStyleTitle')} onBack={() => goToWebsite(backPath)}>
        <Alert variant="destructive">
          <AlertDescription>{t('themeTokenMissing')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  function save() {
    if (!theme || !values) return
    const snap = resolveTextStyle(theme, values)
    const customization = finalizeElementCustomization(
      normalizeWebsiteElementCustomization(values.customization),
      defaultElementHtml('text', values.id, {
        color: snap.color,
        fontFamily: snap.fontFamily,
        fontSize: snap.size,
      }),
      values.id,
    )
    const parsed = websiteTextStyleSchema.safeParse({
      ...values,
      size: fallbackTextSize(values.sizeByBreakpoint),
      customization: hasElementCustomization(customization) ? customization : undefined,
    })
    if (!parsed.success) {
      setFieldErrors(mapThemeFieldErrors(parsed.error.issues))
      toast({ title: t('textLibrarySaveFailed'), variant: 'destructive' })
      return
    }
    const nextTheme = theme
    if (!nextTheme) return
    persistTheme({
      ...nextTheme,
      textStyles: upsertById(nextTheme.textStyles, parsed.data),
    })
    setFieldErrors({})
    toast({ title: t('themeChangesSaved') })
    goToWebsite(backPath)
  }

  const canEdit = canManage && !theme.isLocked

  return (
    <FeaturePage
      title={values.name || t('editTextStyleTitle')}
      onBack={() => goToWebsite(backPath)}
      actions={
        canEdit && values.sourceLibraryId ? (
          <WebsiteLibraryDownloadUpdateButton
            disabled={saving || download.downloading}
            onClick={() => download.ask(values)}
          />
        ) : null
      }
    >
      {theme.isLocked ? null : <WebsiteLibrarySourceTag sourceLibraryId={values.sourceLibraryId} />}
      {download.dialog}
      <div className="space-y-6">
        <ThemeTextStyleEditPanel
          theme={theme}
          values={values}
          onValuesChange={setValues}
          fieldErrors={fieldErrors}
          elementTab={elementTab}
          onElementTabChange={setElementTab}
          previewBreakpoint={previewBreakpoint}
          onPreviewBreakpointChange={setPreviewBreakpoint}
        />
        <div className="flex justify-end gap-2 border-t border-[hsl(var(--glass-border))] pt-4">
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => goToWebsite(backPath)}>
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10 px-4" onClick={save} disabled={saving}>
            <Save className="mr-2 h-4 w-4" aria-hidden />
            {saving ? t('saving') : tc('save')}
          </Button>
        </div>
      </div>
    </FeaturePage>
  )
}
