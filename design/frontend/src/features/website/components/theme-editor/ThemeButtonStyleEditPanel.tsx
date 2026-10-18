import { useTranslation } from 'react-i18next'
import { Form, FormField, Input, ReadOnlyField } from '@webonone/ui-kit'
import { buttonLabelTypography, resolveButtonStyle } from '../../document/theme'
import type { WebsiteButtonStyle, WebsiteTheme } from '../../types'
import {
  buttonVisualFromResolved,
  defaultElementHtml,
  normalizeWebsiteElementCustomization,
} from '../../utils/websiteElementCustomization'
import { WebsiteElementCustomizationPreview } from '../WebsiteElementCustomizationPreview'
import {
  WebsiteElementEditorTabs,
  type WebsiteElementEditorLayout,
  type WebsiteElementEditorMode,
  type WebsiteElementEditorTab,
} from '../WebsiteElementEditorTabs'
import { ThemeTokenSelect } from './ThemeTokenSelect'

function borderWidthForColor(borderColorId: string, current: number): number {
  if (!borderColorId) return 0
  return current > 0 ? current : 1
}

type ThemeButtonStyleEditPanelProps = {
  theme: WebsiteTheme
  values: WebsiteButtonStyle
  onValuesChange: (next: WebsiteButtonStyle) => void
  fieldErrors: Partial<Record<string, string>>
  elementTab: WebsiteElementEditorTab
  onElementTabChange: (tab: WebsiteElementEditorTab) => void
  layout?: WebsiteElementEditorLayout
  mode?: WebsiteElementEditorMode
  onEdit?: (tab: WebsiteElementEditorTab) => void
}

export function ThemeButtonStyleEditPanel({
  theme,
  values,
  onValuesChange,
  fieldErrors,
  elementTab,
  onElementTabChange,
  layout = 'dialog',
  mode = 'edit',
  onEdit,
}: ThemeButtonStyleEditPanelProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const snap = resolveButtonStyle(theme, values)
  const previewLabel = t('buttonPreviewLabel')
  const previewBaseStyle = {
    ...buttonLabelTypography(),
    background: snap.background,
    color: snap.textColor,
    border: `${snap.borderWidth}px solid ${snap.borderColor}`,
    borderRadius: snap.radius,
    fontFamily: snap.fontFamily,
    fontSize: snap.fontSize,
  }
  const customization = normalizeWebsiteElementCustomization(values.customization)
  const elementVisual = buttonVisualFromResolved(snap)
  const defaultHtml = defaultElementHtml('button', values.id, elementVisual)
  const colorOptions = theme.colors.map((color) => ({
    id: color.id,
    label: color.name,
    swatch: color.value,
  }))

  function colorReadout(colorId: string) {
    const color = theme.colors.find((entry) => entry.id === colorId)
    if (!color) return '—'
    return (
      <span className="inline-flex items-center gap-2">
        <span
          className="h-4 w-4 shrink-0 rounded-sm border border-[hsl(var(--glass-border))]"
          style={{ backgroundColor: color.value }}
          aria-hidden
        />
        {`${color.name} (${color.value})`}
      </span>
    )
  }

  const generalView = (
    <div className="space-y-4">
      <ReadOnlyField label={t('name')} value={values.name} />
      <ReadOnlyField
        label={t('textStyle')}
        value={theme.textStyles.find((style) => style.id === values.textStyleId)?.name}
      />
      <ReadOnlyField label={t('backgroundColor')} value={colorReadout(values.backgroundColorId)} />
      <ReadOnlyField label={t('fontColor')} value={colorReadout(values.textColorId)} />
      <ReadOnlyField label={t('borderColor')} value={colorReadout(values.borderColorId)} />
      <ReadOnlyField label={t('borderRadius')} value={String(values.radius)} />
    </div>
  )

  const generalFields = (
    <Form className="space-y-4">
      <FormField label={t('name')} htmlFor="theme-button-name" required error={fieldErrors.name}>
        <Input
          id="theme-button-name"
          value={values.name}
          onChange={(event) => onValuesChange({ ...values, name: event.target.value })}
        />
      </FormField>
      <FormField label={t('textStyle')} htmlFor="theme-button-text-style">
        <ThemeTokenSelect
          id="theme-button-text-style"
          value={values.textStyleId}
          noneLabel={tc('none')}
          options={theme.textStyles.map((style) => ({ id: style.id, label: style.name }))}
          onChange={(textStyleId) => onValuesChange({ ...values, textStyleId })}
        />
      </FormField>
      <FormField label={t('backgroundColor')} htmlFor="theme-button-bg">
        <ThemeTokenSelect
          id="theme-button-bg"
          value={values.backgroundColorId}
          noneLabel={tc('none')}
          options={colorOptions}
          onChange={(backgroundColorId) => onValuesChange({ ...values, backgroundColorId })}
        />
      </FormField>
      <FormField label={t('fontColor')} htmlFor="theme-button-text-color">
        <ThemeTokenSelect
          id="theme-button-text-color"
          value={values.textColorId}
          noneLabel={tc('none')}
          options={colorOptions}
          onChange={(textColorId) => onValuesChange({ ...values, textColorId })}
        />
      </FormField>
      <FormField label={t('borderColor')} htmlFor="theme-button-border">
        <ThemeTokenSelect
          id="theme-button-border"
          value={values.borderColorId}
          noneLabel={tc('none')}
          options={colorOptions}
          onChange={(borderColorId) =>
            onValuesChange({
              ...values,
              borderColorId,
              borderWidth: borderWidthForColor(borderColorId, values.borderWidth),
            })
          }
        />
      </FormField>
      <FormField label={t('borderRadius')} htmlFor="theme-button-radius" error={fieldErrors.radius}>
        <Input
          id="theme-button-radius"
          type="number"
          min={0}
          max={999}
          value={values.radius}
          onChange={(event) => onValuesChange({ ...values, radius: Number(event.target.value) || 0 })}
        />
      </FormField>
    </Form>
  )

  return (
    <WebsiteElementEditorTabs
      tab={elementTab}
      onTabChange={onElementTabChange}
      kind="button"
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
          kind="button"
          customization={customization}
          placeholders={{ label: previewLabel }}
          defaultHtml={defaultHtml}
          visual={elementVisual}
          baseStyle={previewBaseStyle}
          className="inline-flex"
          fallback={
            <span className="inline-flex items-center justify-center px-4 py-2">
              {previewLabel}
            </span>
          }
        />
      }
      general={generalFields}
      generalView={generalView}
    />
  )
}
