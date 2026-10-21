import { useTranslation } from 'react-i18next'
import { FormField, Input, ReadOnlyField, Tabs, TabsList, TabsTrigger } from '@webonone/ui-kit'
import { fallbackTextSize, resolveTextStyle } from '../../document/theme'
import { WEBSITE_BREAKPOINTS, type WebsiteBreakpoint, type WebsiteTextStyle, type WebsiteTheme } from '../../types'
import {
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
  const snap = resolveTextStyle(theme, values, previewBreakpoint)
  const previewSample = t('textPreviewSample')
  const customization = normalizeWebsiteElementCustomization(values.customization)
  const previewBaseStyle = {
    fontFamily: snap.fontFamily,
    fontSize: snap.size,
    color: snap.color,
    backgroundColor: theme.pageBackground,
  }
  const elementVisual = withPaletteColors(
    {
      color: snap.color,
      fontFamily: snap.fontFamily,
      fontSize: snap.size,
    },
    themePaletteColorValues(theme, values.colorPaletteId),
  )
  const defaultHtml = defaultElementHtml('text', values.id, elementVisual)
  const paletteOptions = themePaletteSelectOptions(theme)
  const themePaletteId = stylePaletteId(theme, null)
  const storedPaletteId = values.colorPaletteId?.trim() || ''
  const colorPaletteId = !storedPaletteId || storedPaletteId === themePaletteId ? '' : storedPaletteId
  const colorOptions = themeColorOptionsForPalette(theme, colorPaletteId || themePaletteId)
  const inheritedPaletteName = theme.colorPalettes.find((palette) => palette.id === themePaletteId)?.name
  const paletteNoneLabel = inheritedPaletteName
    ? t('inheritColorPaletteNamed', { name: inheritedPaletteName })
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
    values.fontId,
  )
  const colorOptionsWithFallback = withTokenFallback(colorOptions, String(values.colorIndex || ''))

  const generalFields = (
    <TextStyleBasicSettingsFields
      mode={mode === 'view' ? 'view' : 'edit'}
      idPrefix="theme-text"
      values={{
        name: values.name,
        fontId: values.fontId,
        colorPaletteId,
        colorId: String(values.colorIndex || ''),
        size: values.size,
      }}
      onChange={(next) => {
        const previousEffective = stylePaletteId(theme, values.colorPaletteId)
        const nextEffective = stylePaletteId(theme, next.colorPaletteId)
        const paletteChanged = nextEffective !== previousEffective
        onValuesChange({
          ...values,
          name: next.name,
          fontId: next.fontId,
          colorPaletteId: paletteOverrideForSave(themePaletteId, next.colorPaletteId),
          colorIndex: paletteChanged
            ? remapColorIndex(theme, nextEffective, Number(next.colorId) || 1)
            : Number(next.colorId) || 1,
        })
      }}
      fieldErrors={fieldErrors}
      fontOptions={fontOptions}
      paletteOptions={paletteOptions}
      colorOptions={colorOptionsWithFallback}
      allowNone
      noneLabel={tc('none')}
      paletteNoneLabel={paletteNoneLabel}
      fontPlaceholder={t('pickFontRequired')}
      colorPlaceholder={t('pickColorRequired')}
      showSize={false}
    >
      {mode === 'view' ? (
        <div className="grid grid-cols-5 gap-2">
          {WEBSITE_BREAKPOINTS.map((breakpoint) => (
            <ReadOnlyField
              key={breakpoint}
              label={t(SIZE_LABEL_KEYS[breakpoint])}
              value={String(values.sizeByBreakpoint?.[breakpoint] ?? values.size)}
            />
          ))}
        </div>
      ) : (
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
      )}
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
      generalView={generalFields}
    />
  )
}
