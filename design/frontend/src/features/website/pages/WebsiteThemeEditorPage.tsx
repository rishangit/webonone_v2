import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, FeaturePage, Tabs, TabsContent, TabsList, TabsTrigger, useToast } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { fallbackTextSize } from '../document/theme'
import { useDebouncedCallback, useThemePersistence } from '../hooks/useThemePersistence'
import { websiteThemesActions } from '../store'
import { WEBSITE_BREAKPOINTS } from '../types'
import type { WebsiteTextStyle, WebsiteTheme } from '../types'
import { parseGoogleFontFamily } from '../utils/parseGoogleFontFamily'
import { ThemeBasicSettingsTab } from '../components/theme-editor/ThemeBasicSettingsTab'
import { ThemeButtonsTab } from '../components/theme-editor/ThemeButtonsTab'
import { ThemeColorsTab } from '../components/theme-editor/ThemeColorsTab'
import { ThemeFontsTab } from '../components/theme-editor/ThemeFontsTab'
import { ThemeTextsTab } from '../components/theme-editor/ThemeTextsTab'

const THEME_TABS = [
  { id: 'basic', labelKey: 'basicSettings' },
  { id: 'fonts', labelKey: 'fonts' },
  { id: 'colors', labelKey: 'colors' },
  { id: 'texts', labelKey: 'texts' },
  { id: 'buttons', labelKey: 'buttons' },
] as const
type ThemeTabId = (typeof THEME_TABS)[number]['id']

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
  }
}

function hydrateThemeDraft(theme: WebsiteTheme): WebsiteTheme {
  return {
    ...theme,
    textStyles: theme.textStyles.map(hydrateTextStyle),
  }
}

export function WebsiteThemeEditorPage() {
  const { t } = useTranslation('website')
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const { goToWebsite } = useNavigateDesign()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.websiteThemes)
  const [theme, setTheme] = useState<WebsiteTheme | null>(null)
  const [tab, setTab] = useState<ThemeTabId>('basic')

  const syncTheme = useCallback((next: WebsiteTheme) => {
    setTheme(hydrateThemeDraft(next))
  }, [])

  const { persistTheme, saving, fieldErrors } = useThemePersistence(theme, syncTheme)

  const debouncedPersistBasic = useDebouncedCallback(
    (next: WebsiteTheme) => persistTheme(next),
    400,
  )

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
    <FeaturePage title={theme.name || t('themes')} onBack={() => goToWebsite('/website/themes')}>
      {fontUrls.map((url) => (
        <link key={url} rel="stylesheet" href={url} />
      ))}
      {detailError && detailStatus === 'error' ? (
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      ) : null}
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
            fieldErrors={fieldErrors}
            onChange={(next) => {
              setTheme(next)
              debouncedPersistBasic(next)
            }}
          />
        </TabsContent>
        <TabsContent value="fonts" className="mt-0 outline-none">
          <ThemeFontsTab {...tokenTabProps} onFontInUse={() => toast({ title: t('fontInUse') })} />
        </TabsContent>
        <TabsContent value="colors" className="mt-0 outline-none">
          <ThemeColorsTab {...tokenTabProps} onColorInUse={() => toast({ title: t('colorInUse') })} />
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
    </FeaturePage>
  )
}
