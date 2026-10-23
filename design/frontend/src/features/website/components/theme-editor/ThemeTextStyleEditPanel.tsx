import { useTranslation } from 'react-i18next'
import { FormField, Input, ReadOnlyField, Tabs, TabsList, TabsTrigger } from '@webonone/ui-kit'
import { fallbackTextSize, resolveTextStyle } from '../../document/theme'
import { WEBSITE_BREAKPOINTS, type WebsiteBreakpoint, type WebsiteTextStyle, type WebsiteTheme } from '../../types'
import { colorSlotId, colorSlotIndex } from '../../utils/colorSelect'
import {
  migrateLegacyTextStylePalette,
  paletteOverrideForSave,
  remapColorIndex,
  stylePaletteId,
  themeColorOptionsForPalette,
  themePaletteColorValues,
  themePaletteSelectOptions,
} from '../../utils/websitePalette'
import {
  defaultElementHtml,
  normalizeWebsiteElementCustomization,
  withPaletteColors,
} from '../../utils/websiteElementCustomization'
import {
  TextStyleBasicSettingsFields,
  type TextStyleBasicSettingsOption,
} from '../TextStyleBasicSettingsFields'
import { WebsiteElementCustomizationPreview } from '../WebsiteElementCustomizationPreview'
import {
  WebsiteElementEditorTabs,
  type WebsiteElementEditorLayout,
  type WebsiteElementEditorMode,
  type WebsiteElementEditorTab,
} from '../WebsiteElementEditorTabs'
import { defaultSizeByBreakpoint, SIZE_LABEL_KEYS } from './textStyleDefaults'

type ThemeTextStyleEditPanelProps = {
  theme: WebsiteTheme
  values: WebsiteTextStyle
  onValuesChange: (next: WebsiteTextStyle) => void
  fieldErrors: Record<string, string>
  elementTab: WebsiteElementEditorTab
  onElementTabChange: (tab: WebsiteElementEditorTab) => void
  previewBreakpoint: WebsiteBreakpoint
  onPreviewBreakpointChange: (breakpoint: WebsiteBreakpoint) => void
  layout?: WebsiteElementEditorLayout
  mode?: WebsiteElementEditorMode
  onEdit?: (tab: WebsiteElementEditorTab) => void
}

export function ThemeTextStyleEditPanel({
  theme,
  values,
  onValuesChange,
  fieldErrors,
  elementTab,
  onElementTabChange,
  previewBreakpoint,
  onPreviewBreakpointChange,
  layout = 'dialog',
  mode = 'edit',
  onEdit,
}: ThemeTextStyleEditPanelProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const styleValues = migrateLegacyTextStylePalette(theme, values)
  const snap = resolveTextStyle(theme, styleValues, previewBreakpoint)
  const previewSample = t('textPreviewSample')
  const customization = normalizeWebsiteElementCustomization(values.customization)
  const previewBaseStyle = {
    fontFamily: snap.fontFamily,
    fontSize: snap.size,
    color: snap.color,
    backgroundColor: theme.pageBackground,
  }
  const themePaletteId = stylePaletteId(theme, null)
  const stylePaletteEffective = stylePaletteId(theme, styleValues.colorPaletteId)
  const stylePaletteName = theme.colorPalettes.find((palette) => palette.id === stylePaletteEffective)?.name
  const previewPaletteId =
    stylePaletteId(theme, styleValues.fontColorPaletteId) || stylePaletteEffective
  const elementVisual = withPaletteColors(
    {
      color: snap.color,
      fontFamily: snap.fontFamily,
      fontSize: snap.size,
    },
    themePaletteColorValues(theme, previewPaletteId),
  )
  const defaultHtml = defaultElementHtml('text', values.id, elementVisual)
  const paletteOptions = themePaletteSelectOptions(theme)
  function uiPaletteOverride(stored: string | null | undefined, inheritFromPaletteId: string): string {
    const trimmed = stored?.trim() || ''
    if (!trimmed || trimmed === inheritFromPaletteId) return ''
    return trimmed
  }

  const styleColorPaletteUi = uiPaletteOverride(styleValues.colorPaletteId, themePaletteId)
  const fontColorPaletteUi = uiPaletteOverride(styleValues.fontColorPaletteId, stylePaletteEffective)
  const perColorPaletteNoneLabel = stylePaletteName
    ? t('inheritColorPaletteNamed', { name: stylePaletteName })
    : t('inheritColorPalette')
  const missingTokenLabel = t('themeTokenMissing')
  const withTokenFallback = (options: TextStyleBasicSettingsOption[], id: string) =>
    id && !options.some((entry) => entry.id === id)
      ? [...options, { id, label: missingTokenLabel }]
      : options
  const fontOptions = withTokenFallback(
    theme.fonts.map((font) => ({
      id: font.id,
      label: font.name || font.family,
      fontFamily: font.family,
      previewText: previewSample,
    })),
    styleValues.fontId,
  )
  const colorSlot = colorSlotId(styleValues.colorIndex)

  function remapSingleColor(paletteId: string, colorId: string) {
    return colorSlotId(
      remapColorIndex(theme, paletteId || stylePaletteEffective, colorSlotIndex(colorId)),
    )
  }

  function storedPaletteOverride(inheritFromPaletteId: string, perColorUi: string): string | null {
    const trimmed = perColorUi.trim()
    if (!trimmed) return null
    return paletteOverrideForSave(inheritFromPaletteId, trimmed)
  }

  const textBasicValues = {
    name: styleValues.name,
    fontId: styleValues.fontId,
    styleColorPaletteId: styleColorPaletteUi,
    fontColorPaletteId: fontColorPaletteUi,
    colorId: colorSlot,
    size: styleValues.size,
  }

  const textBasicProps = {
    idPrefix: 'theme-text' as const,
    values: textBasicValues,
    styleDefaultPaletteId: themePaletteId,
    stylePaletteNoneLabel: tc('none'),
    perColorPaletteNoneLabel,
    getColorOptionsForPalette: (paletteId: string) =>
      withTokenFallback(themeColorOptionsForPalette(theme, paletteId || stylePaletteEffective), colorSlot),
    onRemapColorForPalette: ({ toPaletteId, colorId }: { toPaletteId: string; colorId: string }) =>
      remapSingleColor(toPaletteId, colorId),
    fieldErrors,
    fontOptions,
    paletteOptions,
    colorOptions: themeColorOptionsForPalette(theme, themePaletteId),
    allowNone: true as const,
    noneLabel: tc('none'),
    fontPlaceholder: t('pickFontRequired'),
    colorPlaceholder: t('pickColorRequired'),
    showSize: false as const,
  }

  const breakpointSizesView = (
    <div className="grid grid-cols-5 gap-2">
      {WEBSITE_BREAKPOINTS.map((breakpoint) => (
        <ReadOnlyField
          key={breakpoint}
          label={t(SIZE_LABEL_KEYS[breakpoint])}
          value={String(values.sizeByBreakpoint?.[breakpoint] ?? values.size)}
        />
      ))}
    </div>
  )

  const generalView = (
    <TextStyleBasicSettingsFields mode="view" {...textBasicProps}>
      {breakpointSizesView}
    </TextStyleBasicSettingsFields>
  )

  const generalFields = (
    <TextStyleBasicSettingsFields
      mode="edit"
      {...textBasicProps}
      onChange={(next) => {
        const nextStylePaletteId = storedPaletteOverride(themePaletteId, next.styleColorPaletteId)
        const nextStyleEffective = stylePaletteId(theme, nextStylePaletteId)
        const previousStyleEffective = stylePaletteEffective
        const stylePaletteChanged = nextStyleEffective !== previousStyleEffective
        let colorIndex = colorSlotIndex(next.colorId)
        if (stylePaletteChanged && !storedPaletteOverride(previousStyleEffective, next.fontColorPaletteId)) {
          colorIndex = remapColorIndex(theme, nextStyleEffective, colorIndex)
        }
        onValuesChange(
          migrateLegacyTextStylePalette(theme, {
            ...styleValues,
            name: next.name,
            fontId: next.fontId,
            colorPaletteId: nextStylePaletteId,
            fontColorPaletteId: storedPaletteOverride(nextStyleEffective, next.fontColorPaletteId),
            colorIndex,
          }),
        )
      }}
    >
      <>
      <div className="grid grid-cols-5 gap-2">
        {WEBSITE_BREAKPOINTS.map((breakpoint) => (
          <FormField
            key={breakpoint}
            label={t(SIZE_LABEL_KEYS[breakpoint])}
            htmlFor={`theme-text-size-${breakpoint}`}
            error={fieldErrors[`sizeByBreakpoint.${breakpoint}`]}
          >
            <Input
              type="number"
              min={8}
              max={200}
              value={values.sizeByBreakpoint?.[breakpoint] ?? values.size}
              onChange={(event) => {
                const sizeByBreakpoint = {
                  ...defaultSizeByBreakpoint(values.size),
                  ...values.sizeByBreakpoint,
                  [breakpoint]: Number(event.target.value) || 16,
                }
                onValuesChange({
                  ...values,
                  sizeByBreakpoint,
                  size: fallbackTextSize(sizeByBreakpoint),
                })
              }}
            />
          </FormField>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2">
        <p className="text-xs text-muted-foreground">{t('breakpoint')}</p>
        <Tabs
          value={previewBreakpoint}
          onValueChange={(value) => onPreviewBreakpointChange(value as WebsiteBreakpoint)}
        >
          <TabsList className="h-8 w-auto min-w-0 px-0" aria-label={t('breakpoint')}>
            {WEBSITE_BREAKPOINTS.map((item) => (
              <TabsTrigger key={item} value={item} className="h-7 px-2 text-xs">
                {item}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      </>
    </TextStyleBasicSettingsFields>
  )

  return (
    <WebsiteElementEditorTabs
      tab={elementTab}
      onTabChange={onElementTabChange}
      kind="text"
      layout={layout}
      mode={mode}
      onEdit={onEdit}
      scopeId={values.id}
      customization={customization}
      defaultHtml={defaultHtml}
      visual={elementVisual}
      onCustomizationChange={(next) => onValuesChange({ ...values, customization: next })}
      preview={
        <WebsiteElementCustomizationPreview
          scopeId={values.id}
          kind="text"
          customization={customization}
          placeholders={{ content: previewSample }}
          defaultHtml={defaultHtml}
          visual={elementVisual}
          baseStyle={previewBaseStyle}
          className="min-h-[2rem] whitespace-pre-wrap"
          fallback={<p className="truncate" style={previewBaseStyle}>{previewSample}</p>}
        />
      }
      general={generalFields}
      generalView={generalView}
    />
  )
}
