import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, FeaturePage, Tabs, TabsContent, TabsList, TabsTrigger, useToast } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { fallbackTextSize } from '../document/theme'
import { useThemePersistence } from '../hooks/useThemePersistence'
import { websiteThemesActions } from '../store'
import { WEBSITE_BREAKPOINTS } from '../types'
import type { WebsiteTextStyle, WebsiteTheme } from '../types'
import { parseGoogleFontFamily } from '../utils/parseGoogleFontFamily'
import { migrateLegacyTextStylePalette, normalizeWebsiteTheme } from '../utils/websitePalette'
import { ThemeBasicSettingsTab } from '../components/theme-editor/ThemeBasicSettingsTab'
import { ThemeButtonsTab } from '../components/theme-editor/ThemeButtonsTab'
import { ThemeColorsTab } from '../components/theme-editor/ThemeColorsTab'
import { ThemeFontsTab } from '../components/theme-editor/ThemeFontsTab'
import { ThemeTextsTab } from '../components/theme-editor/ThemeTextsTab'
import {
  useWebsiteLibraryRevert,
  WebsiteLibraryDownloadUpdateButton,
  WebsiteLibrarySourceTag,
} from '../components/WebsiteLibraryRevert'

const THEME_TABS = [
  { id: 'basic', labelKey: 'basicSettings' },
  { id: 'fonts', labelKey: 'fonts' },
  { id: 'colors', labelKey: 'colors' },
  { id: 'texts', labelKey: 'texts' },
  { id: 'buttons', labelKey: 'buttons' },
] as const
type ThemeTabId = (typeof THEME_TABS)[number]['id']

function hydrateTextStyle(theme: WebsiteTheme, style: WebsiteTextStyle): WebsiteTextStyle {
  const sizeByBreakpoint = Object.fromEntries(
    WEBSITE_BREAKPOINTS.map((breakpoint) => [
      breakpoint,
      style.sizeByBreakpoint?.[breakpoint] ?? style.size ?? 16,
    ]),
  ) as NonNullable<WebsiteTextStyle['sizeByBreakpoint']>
  return migrateLegacyTextStylePalette(theme, {
    ...style,
    sizeByBreakpoint,
    size: fallbackTextSize(sizeByBreakpoint),
  })
}

function hydrateThemeDraft(theme: WebsiteTheme): WebsiteTheme {
  const normalized = normalizeWebsiteTheme(theme)
  return {
    ...normalized,
    textStyles: normalized.textStyles.map((style) => hydrateTextStyle(normalized, style)),
  }
}

export function WebsiteThemeEditorPage() {
  const { t } = useTranslation('website')
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const { goToWebsite } = useNavigateDesign()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const canManage = user?.role === 'super_admin' || user?.role === 'company_admin'
  const revert = useWebsiteLibraryRevert()
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.websiteThemes)
  const [theme, setTheme] = useState<WebsiteTheme | null>(null)
  const [tab, setTab] = useState<ThemeTabId>('basic')

  const syncTheme = useCallback((next: WebsiteTheme) => {
    setTheme(hydrateThemeDraft(next))
  }, [])

  const { persistTheme, saving, fieldErrors } = useThemePersistence(theme, syncTheme)

  usePlatformLoading(detailStatus === 'loading' && !detail ? t('loading') : null)

  useEffect(() => {
    if (id) dispatch(websiteThemesActions.fetchDetailRequested({ id, force: true }))
  }, [dispatch, id])

  useEffect(() => {
    if (saving) return
    if (detail && detail.id === id) setTheme(hydrateThemeDraft(detail))
  }, [detail, id, saving])

  const fontUrls = useMemo(
    () =>
      (theme?.fonts ?? [])
        .map((font) => font.googleFontUrl)
        .filter((url) => Boolean(url) && parseGoogleFontFamily(url)),
    [theme?.fonts],
  )

  if (!accessToken) return <Navigate to="/login" replace />
  if (!id || !theme) {
    return (
      <FeaturePage title={t('themes')} onBack={() => goToWebsite('/website/themes')}>
        {detailError ? <p className="text-sm text-destructive">{detailError}</p> : null}
      </FeaturePage>
    )
  }

  const tokenTabProps = {
    theme,
    onPersist: persistTheme,
    saving,
    fieldErrors,
  }

  return (
    <FeaturePage
      title={theme.name || t('themes')}
      onBack={() => goToWebsite('/website/themes')}
      actions={
        canManage && theme.sourceLibraryId ? (
          <WebsiteLibraryDownloadUpdateButton
            disabled={revert.reverting}
            onClick={() => revert.ask({ kind: 'themes', id: theme.id, name: theme.name })}
          />
        ) : null
      }
    >
      {fontUrls.map((url) => (
        <link key={url} rel="stylesheet" href={url} />
      ))}
      {detailError && detailStatus === 'error' ? (
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      ) : null}
      <WebsiteLibrarySourceTag sourceLibraryId={theme.sourceLibraryId} />
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as ThemeTabId)}
        className="flex flex-col gap-6"
      >
        <TabsList aria-label={t('themeSections')}>
          {THEME_TABS.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {t(item.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="basic" className="mt-0 outline-none">
          <ThemeBasicSettingsTab
            theme={theme}
            canManage={canManage}
            saving={saving}
            fieldErrors={fieldErrors}
            onPersist={(next) => {
              setTheme(hydrateThemeDraft(next))
              return persistTheme(next)
            }}
          />
        </TabsContent>
        <TabsContent value="fonts" className="mt-0 outline-none">
          <ThemeFontsTab {...tokenTabProps} onFontInUse={() => toast({ title: t('fontInUse') })} />
        </TabsContent>
        <TabsContent value="colors" className="mt-0 outline-none">
          <ThemeColorsTab {...tokenTabProps} />
        </TabsContent>
        <TabsContent value="texts" className="mt-0 outline-none">
          <ThemeTextsTab
            {...tokenTabProps}
            onTextStyleInUse={() => toast({ title: t('textStyleInUse') })}
          />
        </TabsContent>
        <TabsContent value="buttons" className="mt-0 outline-none">
          <ThemeButtonsTab {...tokenTabProps} />
        </TabsContent>
      </Tabs>
      {revert.dialog}
    </FeaturePage>
  )
}
