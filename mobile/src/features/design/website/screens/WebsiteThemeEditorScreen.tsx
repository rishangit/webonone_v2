import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  ColorInput,
  FeatureScreen,
  FormField,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  ItemListMenuSeparator,
  ListAddButton,
  Spinner,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextField,
  useToast,
} from '@webonone/mobile-ui'
import { ThemeButtonStyleDialog } from '@/features/design/website/components/ThemeButtonStyleDialog'
import { ThemeCssImportDialog } from '@/features/design/website/components/ThemeCssImportDialog'
import { ThemeFontDialog } from '@/features/design/website/components/ThemeFontDialog'
import { ThemeTextStyleDialog } from '@/features/design/website/components/ThemeTextStyleDialog'
import { defaultSizeByBreakpoint } from '@/features/design/website/components/textStyleDefaults'
import { fallbackTextSize } from '@/features/design/website/document/theme'
import { useDesignPermissions } from '@/features/design/hooks/useDesignPermissions'
import { websiteHubPath } from '@/features/design/utils/designPaths'
import { websiteThemeEditorSchema } from '@/features/design/website/schemas/websiteThemeSchemas'
import {
  mergeImportedSwatches,
  pageChromeFromTokens,
  WEBSITE_PALETTE_SLOT_NAME_KEYS,
} from '@/features/design/website/utils/websitePalette'
import { upsertById } from '@/features/design/website/utils/upsertById'
import { WEBSITE_BREAKPOINTS, type WebsiteTextStyle, type WebsiteTheme } from '@/features/design/website/types'
import { websiteAdminApi } from '@/shared/services/websiteAdminApi'

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
    sizeByBreakpoint: { ...defaultSizeByBreakpoint(style.size), ...sizeByBreakpoint },
    size: fallbackTextSize(sizeByBreakpoint),
  }
}

function hydrateThemeDraft(theme: WebsiteTheme): WebsiteTheme {
  return {
    ...theme,
    textStyles: theme.textStyles.map(hydrateTextStyle),
  }
}

export function WebsiteThemeEditorScreen({ themeId }: { themeId: string }) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { toast } = useToast()
  const { canManage, hasCompany } = useDesignPermissions()
  const [theme, setTheme] = useState<WebsiteTheme | null>(null)
  const [tab, setTab] = useState<ThemeTabId>('basic')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [fontDialog, setFontDialog] = useState<{ font?: WebsiteTheme['fonts'][number] } | null>(null)
  const [textDialog, setTextDialog] = useState<{ style?: WebsiteTextStyle } | null>(null)
  const [buttonDialog, setButtonDialog] = useState<{ style?: WebsiteTheme['buttonStyles'][number] } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goToList = useCallback(() => {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace(websiteHubPath('themes'))
  }, [router])

  const persistTheme = useCallback(
    async (next: WebsiteTheme) => {
      const parsed = websiteThemeEditorSchema.safeParse({
        name: next.name,
        pageBackground: next.pageBackground,
        bodyTextColor: next.bodyTextColor,
        fonts: next.fonts,
        colors: next.colors,
        textStyles: next.textStyles,
        buttonStyles: next.buttonStyles,
      })
      if (!parsed.success) {
        setFieldErrors(
          Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join('.'), issue.message])),
        )
        return
      }
      setFieldErrors({})
      setSaving(true)
      try {
        const saved = await websiteAdminApi.updateTheme(next.id, { ...parsed.data, isActive: next.isActive })
        setTheme(hydrateThemeDraft({ ...next, ...saved }))
      } catch (err) {
        const message = err instanceof Error ? err.message : t('saveFailed')
        setError(message)
        toast({ title: t('saveFailed'), description: message, variant: 'destructive' })
      } finally {
        setSaving(false)
      }
    },
    [t, toast],
  )

  const schedulePersist = useCallback(
    (next: WebsiteTheme) => {
      setTheme(next)
      if (persistTimer.current) clearTimeout(persistTimer.current)
      persistTimer.current = setTimeout(() => {
        void persistTheme(next)
      }, 400)
    },
    [persistTheme],
  )

  useEffect(() => {
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!themeId || !hasCompany) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    websiteAdminApi
      .getTheme(themeId)
      .then((detail) => {
        if (!cancelled) setTheme(hydrateThemeDraft(detail))
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('saveFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [hasCompany, t, themeId])

  if (!hasCompany) {
    return (
      <FeatureScreen title={t('themes')} onBack={goToList} backLabel={tc('back')}>
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeatureScreen>
    )
  }

  if (loading || !theme) {
    return (
      <FeatureScreen title={t('themes')} onBack={goToList} backLabel={tc('back')}>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Spinner label={t('loading')} />
        )}
      </FeatureScreen>
    )
  }

  const slotNames = WEBSITE_PALETTE_SLOT_NAME_KEYS.map((key) => t(key))

  return (
    <FeatureScreen title={theme.name || t('themes')} onBack={goToList} backLabel={tc('back')}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Tabs value={tab} onValueChange={(value) => setTab(value as ThemeTabId)}>
        <TabsList aria-label={t('themeSections')}>
          {THEME_TABS.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {t(item.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="basic">
          <View className="gap-4 pt-4">
            <FormField label={t('name')} required error={fieldErrors.name}>
              <TextField
                value={theme.name}
                editable={canManage}
                onChangeText={(name) => schedulePersist({ ...theme, name })}
              />
            </FormField>
            <ColorInput
              label={t('pageBackground')}
              value={theme.pageBackground}
              error={fieldErrors.pageBackground}
              disabled={!canManage}
              onChange={(pageBackground) => schedulePersist({ ...theme, pageBackground })}
            />
            <ColorInput
              label={t('bodyTextColor')}
              value={theme.bodyTextColor}
              error={fieldErrors.bodyTextColor}
              disabled={!canManage}
              onChange={(bodyTextColor) => schedulePersist({ ...theme, bodyTextColor })}
            />
            <Switch
              checked={theme.isActive}
              disabled={!canManage || saving}
              label={t('isActive')}
              onCheckedChange={(isActive) => {
                void persistTheme({ ...theme, isActive })
              }}
            />
          </View>
        </TabsContent>
        <TabsContent value="fonts">
          <View className="gap-3 pt-4">
            {canManage ? (
              <ListAddButton compactLabel={tc('add')} onPress={() => setFontDialog({})} disabled={saving}>
                {t('addFont')}
              </ListAddButton>
            ) : null}
            {theme.fonts.length === 0 ? (
              <ItemListEmpty>{t('emptyFonts')}</ItemListEmpty>
            ) : (
              <ItemList>
                {theme.fonts.map((font) => (
                  <ItemListItem key={font.id}>
                    <Pressable className="min-w-0 flex-1" onPress={() => canManage && setFontDialog({ font })}>
                      <ItemListContent title={font.name} subtitle={font.family || font.googleFontUrl} />
                    </Pressable>
                    {canManage ? (
                      <ItemListMenu ariaLabel={t('actionsFor', { name: font.name })}>
                        <ItemListMenuItem onPress={() => setFontDialog({ font })}>{tc('edit')}</ItemListMenuItem>
                        <ItemListMenuSeparator />
                        <ItemListMenuItem
                          destructive
                          onPress={() => {
                            if (theme.textStyles.some((style) => style.fontId === font.id)) {
                              toast({ title: t('fontInUse') })
                              return
                            }
                            void persistTheme({ ...theme, fonts: theme.fonts.filter((item) => item.id !== font.id) })
                          }}
                        >
                          {tc('delete')}
                        </ItemListMenuItem>
                      </ItemListMenu>
                    ) : null}
                  </ItemListItem>
                ))}
              </ItemList>
            )}
          </View>
        </TabsContent>
        <TabsContent value="colors">
          <View className="gap-3 pt-4">
            {canManage ? (
              <Button variant="outline" onPress={() => setImportOpen(true)} disabled={saving}>
                {t('pasteCssFromCColorPalette')}
              </Button>
            ) : null}
            {theme.colors.length === 0 ? (
              <ItemListEmpty>{t('emptyColors')}</ItemListEmpty>
            ) : (
              theme.colors.map((color) => (
                <ColorInput
                  key={color.id}
                  label={color.name}
                  value={color.value}
                  disabled={!canManage}
                  onChange={(value) => {
                    const colors = upsertById(theme.colors, { ...color, value })
                    schedulePersist({ ...theme, colors, ...pageChromeFromTokens(colors) })
                  }}
                />
              ))
            )}
          </View>
        </TabsContent>
        <TabsContent value="texts">
          <View className="gap-3 pt-4">
            {canManage ? (
              <ListAddButton compactLabel={tc('add')} onPress={() => setTextDialog({})} disabled={saving}>
                {t('addTextStyle')}
              </ListAddButton>
            ) : null}
            {theme.textStyles.length === 0 ? (
              <ItemListEmpty>{t('emptyTextStyles')}</ItemListEmpty>
            ) : (
              <ItemList>
                {theme.textStyles.map((style) => (
                  <ItemListItem key={style.id}>
                    <Pressable className="min-w-0 flex-1" onPress={() => canManage && setTextDialog({ style })}>
                      <ItemListContent title={style.name} />
                    </Pressable>
                    {canManage ? (
                      <ItemListMenu ariaLabel={t('actionsFor', { name: style.name })}>
                        <ItemListMenuItem onPress={() => setTextDialog({ style })}>{tc('edit')}</ItemListMenuItem>
                        <ItemListMenuSeparator />
                        <ItemListMenuItem
                          destructive
                          onPress={() => {
                            if (theme.buttonStyles.some((button) => button.textStyleId === style.id)) {
                              toast({ title: t('textStyleInUse') })
                              return
                            }
                            void persistTheme({
                              ...theme,
                              textStyles: theme.textStyles.filter((item) => item.id !== style.id),
                            })
                          }}
                        >
                          {tc('delete')}
                        </ItemListMenuItem>
                      </ItemListMenu>
                    ) : null}
                  </ItemListItem>
                ))}
              </ItemList>
            )}
          </View>
        </TabsContent>
        <TabsContent value="buttons">
          <View className="gap-3 pt-4">
            {canManage ? (
              <ListAddButton compactLabel={tc('add')} onPress={() => setButtonDialog({})} disabled={saving}>
                {t('addButtonStyle')}
              </ListAddButton>
            ) : null}
            {theme.buttonStyles.length === 0 ? (
              <ItemListEmpty>{t('emptyButtonStyles')}</ItemListEmpty>
            ) : (
              <ItemList>
                {theme.buttonStyles.map((style) => (
                  <ItemListItem key={style.id}>
                    <Pressable className="min-w-0 flex-1" onPress={() => canManage && setButtonDialog({ style })}>
                      <ItemListContent title={style.name} />
                    </Pressable>
                    {canManage ? (
                      <ItemListMenu ariaLabel={t('actionsFor', { name: style.name })}>
                        <ItemListMenuItem onPress={() => setButtonDialog({ style })}>{tc('edit')}</ItemListMenuItem>
                        <ItemListMenuSeparator />
                        <ItemListMenuItem
                          destructive
                          onPress={() =>
                            void persistTheme({
                              ...theme,
                              buttonStyles: theme.buttonStyles.filter((item) => item.id !== style.id),
                            })
                          }
                        >
                          {tc('delete')}
                        </ItemListMenuItem>
                      </ItemListMenu>
                    ) : null}
                  </ItemListItem>
                ))}
              </ItemList>
            )}
          </View>
        </TabsContent>
      </Tabs>
      <ThemeFontDialog
        open={fontDialog !== null}
        initial={fontDialog?.font}
        onOpenChange={(open) => {
          if (!open) setFontDialog(null)
        }}
        onSubmit={(font) => void persistTheme({ ...theme, fonts: upsertById(theme.fonts, font) })}
      />
      <ThemeTextStyleDialog
        open={textDialog !== null}
        theme={theme}
        initial={textDialog?.style}
        onOpenChange={(open) => {
          if (!open) setTextDialog(null)
        }}
        onSubmit={(style) => void persistTheme({ ...theme, textStyles: upsertById(theme.textStyles, style) })}
      />
      <ThemeButtonStyleDialog
        open={buttonDialog !== null}
        theme={theme}
        initial={buttonDialog?.style}
        onOpenChange={(open) => {
          if (!open) setButtonDialog(null)
        }}
        onSubmit={(style) => void persistTheme({ ...theme, buttonStyles: upsertById(theme.buttonStyles, style) })}
      />
      <ThemeCssImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(swatches) => {
          const colors = mergeImportedSwatches(swatches, theme.colors, slotNames)
          void persistTheme({ ...theme, colors, ...pageChromeFromTokens(colors) })
        }}
      />
    </FeatureScreen>
  )
}
