import { useTranslation } from 'react-i18next'
import { buttonLabelTypography, resolveButtonStyle } from '../../document/theme'
import type { WebsiteButtonStyle, WebsiteTextStyle, WebsiteTheme } from '../../types'
import { applyButtonBasicToDraft, resolveOwnedButtonLabelStyle } from '../../utils/ownedButtonLabelStyle'
import { upsertById } from '../../utils/upsertById'
import {
  inferThemePaletteId,
  remapColorIdToPalette,
  themeColorOptionsForPalette,
  themePaletteColorValues,
  themePaletteSelectOptions,
} from '../../utils/websitePalette'
import {
  buttonVisualFromResolved,
  defaultElementHtml,
  normalizeWebsiteElementCustomization,
  withPaletteColors,
} from '../../utils/websiteElementCustomization'
import {
  ButtonStyleBasicSettingsFields,
  type ButtonStyleBasicSettingsOption,
  type ButtonStyleBasicSettingsValues,
} from '../ButtonStyleBasicSettingsFields'
import { WebsiteElementCustomizationPreview } from '../WebsiteElementCustomizationPreview'
import {
  WebsiteElementEditorTabs,
  type WebsiteElementEditorLayout,
  type WebsiteElementEditorMode,
  type WebsiteElementEditorTab,
} from '../WebsiteElementEditorTabs'

type ThemeButtonStyleEditPanelProps = {
  theme: WebsiteTheme
  values: WebsiteButtonStyle
  labelStyle: WebsiteTextStyle
  onDraftChange: (button: WebsiteButtonStyle, labelStyle: WebsiteTextStyle) => void
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
  labelStyle,
  onDraftChange,
  fieldErrors,
  elementTab,
  onElementTabChange,
  layout = 'dialog',
  mode = 'edit',
  onEdit,
}: ThemeButtonStyleEditPanelProps) {
  const { t } = useTranslation('website')
  const resolvedLabelStyle = resolveOwnedButtonLabelStyle(theme, values)
  const previewLabelStyle = { ...resolvedLabelStyle, ...labelStyle, id: labelStyle.id || resolvedLabelStyle.id }
  const previewTheme = {
    ...theme,
    textStyles: upsertById(theme.textStyles, previewLabelStyle),
  }
  const snap = resolveButtonStyle(previewTheme, { ...values, textStyleId: previewLabelStyle.id })
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
  const textColorId = previewLabelStyle.colorId || values.textColorId
  const elementVisual = withPaletteColors(
    buttonVisualFromResolved(snap),
    themePaletteColorValues(theme, [values.backgroundColorId, textColorId, values.borderColorId]),
  )
  const defaultHtml = defaultElementHtml('button', values.id, elementVisual)
  const fontOptions = theme.fonts.map((font) => ({
    id: font.id,
    label: font.name,
    fontFamily: font.family,
  }))
  const paletteOptions = themePaletteSelectOptions(theme)
  const colorPaletteId = inferThemePaletteId(theme, [
    values.backgroundColorId,
    textColorId,
    values.borderColorId,
  ])
  const colorOptions = themeColorOptionsForPalette(theme, colorPaletteId)
  const missingTokenLabel = t('themeTokenMissing')
  const withTokenFallback = (options: ButtonStyleBasicSettingsOption[], id: string) =>
    id && !options.some((entry) => entry.id === id)
      ? [...options, { id, label: missingTokenLabel }]
      : options
  const fontOptionsWithFallback = withTokenFallback(fontOptions, previewLabelStyle.fontId)
  let colorOptionsWithFallback: ButtonStyleBasicSettingsOption[] = colorOptions
  for (const colorId of [values.backgroundColorId, textColorId, values.borderColorId]) {
    colorOptionsWithFallback = withTokenFallback(colorOptionsWithFallback, colorId)
  }
  const basicValues: ButtonStyleBasicSettingsValues = {
    name: values.name,
    fontId: previewLabelStyle.fontId,
    colorPaletteId,
    backgroundColorId: values.backgroundColorId,
    textColorId,
    borderColorId: values.borderColorId,
    textSize: previewLabelStyle.size,
    borderWidth: values.borderWidth,
    radius: values.radius,
  }

  const general = (
    <ButtonStyleBasicSettingsFields
      mode={mode}
      values={basicValues}
      onChange={(next) => {
        const paletteChanged = next.colorPaletteId !== colorPaletteId
        const remapped = paletteChanged
          ? {
              ...next,
              backgroundColorId: remapColorIdToPalette(
                theme,
                colorPaletteId,
                next.colorPaletteId,
                next.backgroundColorId,
              ),
              textColorId: remapColorIdToPalette(theme, colorPaletteId, next.colorPaletteId, next.textColorId),
              borderColorId: remapColorIdToPalette(theme, colorPaletteId, next.colorPaletteId, next.borderColorId),
            }
          : next
        const draft = applyButtonBasicToDraft(values, labelStyle, remapped)
        onDraftChange(draft.button, draft.labelStyle)
      }}
      fieldErrors={fieldErrors}
      fontOptions={fontOptionsWithFallback}
      paletteOptions={paletteOptions}
      colorOptions={colorOptionsWithFallback}
      idPrefix="theme-button"
      fontPlaceholder={t('pickFontRequired')}
      colorPlaceholder={t('pickColorRequired')}
    />
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
      onCustomizationChange={(next) => onDraftChange({ ...values, customization: next }, labelStyle)}
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
      general={general}
      generalView={general}
    />
  )
}
