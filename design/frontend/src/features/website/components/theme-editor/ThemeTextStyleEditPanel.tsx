import { useTranslation } from 'react-i18next'
import { Form, FormField, Input, Tabs, TabsList, TabsTrigger } from '@webonone/ui-kit'
import { fallbackTextSize, resolveTextStyle } from '../../document/theme'
import { WEBSITE_BREAKPOINTS, type WebsiteBreakpoint, type WebsiteTextStyle, type WebsiteTheme } from '../../types'
import { defaultElementHtml, normalizeWebsiteElementCustomization } from '../../utils/websiteElementCustomization'
import { WebsiteElementCustomizationPreview } from '../WebsiteElementCustomizationPreview'
import {
  WebsiteElementEditorTabs,
  type WebsiteElementEditorTab,
} from '../WebsiteElementEditorTabs'
import { defaultSizeByBreakpoint, SIZE_LABEL_KEYS } from './textStyleDefaults'
import { ThemeTokenSelect } from './ThemeTokenSelect'

type ThemeTextStyleEditPanelProps = {
  theme: WebsiteTheme
  values: WebsiteTextStyle
  onValuesChange: (next: WebsiteTextStyle) => void
  fieldErrors: Record<string, string>
  elementTab: WebsiteElementEditorTab
  onElementTabChange: (tab: WebsiteElementEditorTab) => void
  previewBreakpoint: WebsiteBreakpoint
  onPreviewBreakpointChange: (breakpoint: WebsiteBreakpoint) => void
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
  const elementVisual = {
    color: snap.color,
    fontFamily: snap.fontFamily,
    fontSize: snap.size,
  }
  const defaultHtml = defaultElementHtml('text', values.id, elementVisual)

  const generalFields = (
    <Form className="space-y-4">
      <FormField label={t('styleName')} htmlFor="theme-text-name" required error={fieldErrors.name}>
        <Input
          id="theme-text-name"
          value={values.name}
          onChange={(event) => onValuesChange({ ...values, name: event.target.value })}
        />
      </FormField>
      <FormField label={t('fontType')} htmlFor="theme-text-font">
        <ThemeTokenSelect
          id="theme-text-font"
          value={values.fontId}
          noneLabel={tc('none')}
          options={theme.fonts.map((font) => ({
            id: font.id,
            label: font.name || font.family,
            fontFamily: font.family,
            previewText: previewSample,
          }))}
          onChange={(fontId) => onValuesChange({ ...values, fontId })}
        />
      </FormField>
      <FormField label={t('fontColor')} htmlFor="theme-text-color">
        <ThemeTokenSelect
          id="theme-text-color"
          value={values.colorId}
          noneLabel={tc('none')}
          options={theme.colors.map((color) => ({ id: color.id, label: color.name, swatch: color.value }))}
          onChange={(colorId) => onValuesChange({ ...values, colorId })}
        />
      </FormField>
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
    </Form>
  )

  return (
    <WebsiteElementEditorTabs
      tab={elementTab}
      onTabChange={onElementTabChange}
      kind="text"
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
    />
  )
}
