import { useTranslation } from 'react-i18next'
import { buttonLabelTypography, resolveButtonStyle } from '../../document/theme'
import type { WebsiteButtonStyle, WebsiteTextStyle, WebsiteTheme } from '../../types'
import { applyButtonBasicToDraft, resolveOwnedButtonLabelStyle } from '../../utils/ownedButtonLabelStyle'
import { upsertById } from '../../utils/upsertById'
import {
  paletteOverrideForSave,
  remapColorIndex,
  stylePaletteId,
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
  const textColorIndex = previewLabelStyle.colorIndex || values.textColorIndex
  const elementVisual = withPaletteColors(
    buttonVisualFromResolved(snap),
    themePaletteColorValues(theme, values.colorPaletteId),
  )
  const defaultHtml = defaultElementHtml('button', values.id, elementVisual)
  const fontOptions = theme.fonts.map((font) => ({
    id: font.id,
    label: font.name,
    fontFamily: font.family,
  }))
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
  const withTokenFallback = (options: ButtonStyleBasicSettingsOption[], id: string) =>
    id && !options.some((entry) => entry.id === id)
      ? [...options, { id, label: missingTokenLabel }]
      : options
  const fontOptionsWithFallback = withTokenFallback(fontOptions, previewLabelStyle.fontId)
  let colorOptionsWithFallback: ButtonStyleBasicSettingsOption[] = colorOptions
  for (const colorId of [values.backgroundColorIndex, textColorIndex, values.borderColorIndex].map(String)) {
    colorOptionsWithFallback = withTokenFallback(colorOptionsWithFallback, colorId)
  }
  const basicValues: ButtonStyleBasicSettingsValues = {
    name: values.name,
    fontId: previewLabelStyle.fontId,
    colorPaletteId,
    backgroundColorId: String(values.backgroundColorIndex || ''),
    textColorId: String(textColorIndex || ''),
    borderColorId: String(values.borderColorIndex || ''),
    textSize: previewLabelStyle.size,
    borderWidth: values.borderWidth,
    radius: values.radius,
  }

  const general = (
    <ButtonStyleBasicSettingsFields
      mode={mode}
      values={basicValues}
      onChange={(next) => {
        const previousEffective = stylePaletteId(theme, values.colorPaletteId)
        const nextEffective = stylePaletteId(theme, next.colorPaletteId)
        const paletteChanged = nextEffective !== previousEffective
        const remapped = paletteChanged
          ? {
              ...next,
              backgroundColorId: String(remapColorIndex(theme, nextEffective, Number(next.backgroundColorId) || 1)),
              textColorId: String(remapColorIndex(theme, nextEffective, Number(next.textColorId) || 1)),
              borderColorId: String(remapColorIndex(theme, nextEffective, Number(next.borderColorId) || 1)),
            }
          : next
        const override = paletteOverrideForSave(themePaletteId, remapped.colorPaletteId)
        const draft = applyButtonBasicToDraft(values, labelStyle, {
          name: remapped.name,
          fontId: remapped.fontId,
          colorPaletteId: override,
          backgroundColorIndex: Number(remapped.backgroundColorId) || 1,
          textColorIndex: Number(remapped.textColorId) || 1,
          borderColorIndex: Number(remapped.borderColorId) || 1,
          textSize: remapped.textSize,
          borderWidth: remapped.borderWidth,
          radius: remapped.radius,
        })
        onDraftChange(draft.button, draft.labelStyle)
      }}
      fieldErrors={fieldErrors}
      fontOptions={fontOptionsWithFallback}
      paletteOptions={paletteOptions}
      colorOptions={colorOptionsWithFallback}
      idPrefix="theme-button"
      paletteNoneLabel={paletteNoneLabel}
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
