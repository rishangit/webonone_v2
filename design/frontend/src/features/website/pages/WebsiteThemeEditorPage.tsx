import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  Form,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { fallbackTextSize } from '../document/theme'
import { websiteThemeEditorSchema } from '../schemas/websiteThemeSchemas'
import { websiteThemesActions } from '../store'
import { WEBSITE_BREAKPOINTS } from '../types'
import type { WebsiteTextStyle, WebsiteTheme } from '../types'
import { mapThemeFieldErrors } from '../utils/mapThemeFieldErrors'
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
  const { t: tc } = useTranslation('common')
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const { goToWebsite } = useNavigateDesign()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.websiteThemes)
  const [theme, setTheme] = useState<WebsiteTheme | null>(null)
  const [tab, setTab] = useState<ThemeTabId>('basic')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [awaitingSave, setAwaitingSave] = useState(false)

  usePlatformLoading(detailStatus === 'loading' && !detail ? t('loading') : null)

  useEffect(() => {
    if (id) dispatch(websiteThemesActions.fetchDetailRequested({ id, force: true }))
  }, [dispatch, id])

  useEffect(() => {
    if (awaitingSave) return
    if (detail && detail.id === id) setTheme(hydrateThemeDraft(detail))
  }, [awaitingSave, detail, id])

  useEffect(() => {
    if (!awaitingSave) return
    if (detailStatus === 'idle' && detail) {
      setAwaitingSave(false)
      toast({ title: t('saved') })
      setTheme(hydrateThemeDraft(detail))
    }
    if (detailStatus === 'error') {
      setAwaitingSave(false)
      toast({
        title: t('saveFailed'),
        description: detailError ?? undefined,
        variant: 'destructive',
      })
    }
  }, [awaitingSave, detail, detailError, detailStatus, t, toast])

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

  function save() {
    if (!theme) return
    const parsed = websiteThemeEditorSchema.safeParse({
      name: theme.name,
      pageBackground: theme.pageBackground,
      bodyTextColor: theme.bodyTextColor,
      fonts: theme.fonts,
      colors: theme.colors,
      textStyles: theme.textStyles,
      buttonStyles: theme.buttonStyles,
    })
    if (!parsed.success) {
      setFieldErrors(mapThemeFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    setAwaitingSave(true)
    dispatch(
      websiteThemesActions.saveDetailRequested({
        id: theme.id,
        body: {
          name: parsed.data.name,
          pageBackground: parsed.data.pageBackground,
          bodyTextColor: parsed.data.bodyTextColor,
          isActive: theme.isActive,
          isDefault: theme.isDefault,
          fonts: parsed.data.fonts,
          colors: parsed.data.colors,
          textStyles: parsed.data.textStyles,
          buttonStyles: parsed.data.buttonStyles,
        },
      }),
    )
  }

  const tabProps = {
    theme,
    onChange: (next: WebsiteTheme) => {
      setTheme(next)
      setFieldErrors({})
    },
    fieldErrors,
  }

  return (
    <FeaturePage
      title={theme.name || t('themes')}
      onBack={() => goToWebsite('/website/themes')}
      actions={
        <Button
          type="submit"
          form="theme-editor-form"
          disabled={detailStatus === 'saving'}
        >
          {detailStatus === 'saving' ? t('saving') : tc('save')}
        </Button>
      }
    >
      {fontUrls.map((url) => (
        <link key={url} rel="stylesheet" href={url} />
      ))}
      {detailError && !awaitingSave && detailStatus === 'error' ? (
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      ) : null}
      <Form
        id="theme-editor-form"
        className="space-y-0"
        onSubmit={(event) => {
          event.preventDefault()
          save()
        }}
      >
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
            <ThemeBasicSettingsTab {...tabProps} />
          </TabsContent>
          <TabsContent value="fonts" className="mt-0 outline-none">
            <ThemeFontsTab {...tabProps} onFontInUse={() => toast({ title: t('fontInUse') })} />
          </TabsContent>
          <TabsContent value="colors" className="mt-0 outline-none">
            <ThemeColorsTab {...tabProps} onColorInUse={() => toast({ title: t('colorInUse') })} />
          </TabsContent>
          <TabsContent value="texts" className="mt-0 outline-none">
            <ThemeTextsTab
              {...tabProps}
              onTextStyleInUse={() => toast({ title: t('textStyleInUse') })}
            />
          </TabsContent>
          <TabsContent value="buttons" className="mt-0 outline-none">
            <ThemeButtonsTab {...tabProps} />
          </TabsContent>
        </Tabs>
      </Form>
    </FeaturePage>
  )
}
