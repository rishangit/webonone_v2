import { useTranslation } from 'react-i18next'
import { buttonLabelTypography, resolveButtonStyle } from '../../document/theme'
import type { WebsiteButtonStyle, WebsiteTextStyle, WebsiteTheme } from '../../types'
import { applyButtonBasicToDraft, resolveOwnedButtonLabelStyle } from '../../utils/ownedButtonLabelStyle'
import { upsertById } from '../../utils/upsertById'
import { colorSlotId, colorSlotIndex } from '../../utils/colorSelect'
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

function uiPaletteOverride(stored: string | null | undefined, inheritFromPaletteId: string): string {
  const trimmed = stored?.trim() || ''
  if (!trimmed || trimmed === inheritFromPaletteId) return ''
  return trimmed
}

function storedPaletteOverride(themePaletteId: string, perColorUi: string): string | null {
  const trimmed = perColorUi.trim()
  if (!trimmed) return null
  return paletteOverrideForSave(themePaletteId, trimmed)
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
  const { t: tc } = useTranslation('common')
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
  const themePaletteId = stylePaletteId(theme, null)
  const stylePaletteEffective = stylePaletteId(theme, values.colorPaletteId)
  const stylePaletteName = theme.colorPalettes.find((palette) => palette.id === stylePaletteEffective)?.name
  const perColorPaletteNoneLabel = stylePaletteName
    ? t('inheritColorPaletteNamed', { name: stylePaletteName })
    : t('inheritColorPalette')
  const previewPaletteId =
    stylePaletteId(theme, values.backgroundColorPaletteId ?? values.colorPaletteId) || themePaletteId
  const elementVisual = withPaletteColors(
    buttonVisualFromResolved(snap),
    themePaletteColorValues(theme, previewPaletteId),
  )
  const defaultHtml = defaultElementHtml('button', values.id, elementVisual)
  const fontOptions = theme.fonts.map((font) => ({
    id: font.id,
    label: font.name,
    fontFamily: font.family,
  }))
  const paletteOptions = themePaletteSelectOptions(theme)
  const missingTokenLabel = t('themeTokenMissing')
  const withTokenFallback = (options: ButtonStyleBasicSettingsOption[], id: string) =>
    id && !options.some((entry) => entry.id === id)
      ? [...options, { id, label: missingTokenLabel }]
      : options

  const fontOptionsWithFallback = withTokenFallback(fontOptions, previewLabelStyle.fontId)

  const basicValues: ButtonStyleBasicSettingsValues = {
    name: values.name,
    fontId: previewLabelStyle.fontId,
    styleColorPaletteId: uiPaletteOverride(values.colorPaletteId, themePaletteId),
    backgroundColorPaletteId: uiPaletteOverride(values.backgroundColorPaletteId, stylePaletteEffective),
    backgroundColorId: colorSlotId(values.backgroundColorIndex),
    textColorPaletteId: uiPaletteOverride(
      values.textColorPaletteId ??
        previewLabelStyle.fontColorPaletteId ??
        previewLabelStyle.colorPaletteId,
      stylePaletteEffective,
    ),
    textColorId: colorSlotId(textColorIndex),
    borderColorPaletteId: uiPaletteOverride(values.borderColorPaletteId, stylePaletteEffective),
    borderColorId: colorSlotId(values.borderColorIndex),
    textSize: previewLabelStyle.size,
    borderWidth: values.borderWidth,
    radius: values.radius,
  }

  function remapSingleColor(paletteId: string, colorId: string) {
    return colorSlotId(remapColorIndex(theme, paletteId || stylePaletteEffective, colorSlotIndex(colorId)))
  }

  function remapIfInherited(
    storedOverride: string | null | undefined,
    index: number | null,
    toPaletteId: string,
  ) {
    if (storedOverride?.trim()) return index
    if (index == null) return index
    return remapColorIndex(theme, toPaletteId, index)
  }

  const basicFieldProps = {
    values: basicValues,
    styleDefaultPaletteId: themePaletteId,
    stylePaletteNoneLabel: tc('none'),
    perColorPaletteNoneLabel,
    getColorOptionsForPalette: (paletteId: string) =>
      withTokenFallback(themeColorOptionsForPalette(theme, paletteId || stylePaletteEffective), ''),
    onRemapColorForPalette: ({ toPaletteId, colorId }: { toPaletteId: string; colorId: string }) =>
      remapSingleColor(toPaletteId, colorId),
    fieldErrors,
    fontOptions: fontOptionsWithFallback,
    paletteOptions,
    colorOptions: themeColorOptionsForPalette(theme, themePaletteId),
    idPrefix: 'theme-button' as const,
    fontPlaceholder: t('pickFontRequired'),
    colorPlaceholder: t('pickColorRequired'),
  }

  const generalView = <ButtonStyleBasicSettingsFields mode="view" {...basicFieldProps} />

  const general = (
    <ButtonStyleBasicSettingsFields
      mode="edit"
      {...basicFieldProps}
      onChange={(next) => {
        const nextStylePaletteId = storedPaletteOverride(themePaletteId, next.styleColorPaletteId)
        const nextStyleEffective = stylePaletteId(theme, nextStylePaletteId)
        const previousStyleEffective = stylePaletteEffective
        const stylePaletteChanged = nextStyleEffective !== previousStyleEffective

        let backgroundColorIndex = colorSlotIndex(next.backgroundColorId)
        let textColorIndexNext = colorSlotIndex(next.textColorId)
        let borderColorIndex = colorSlotIndex(next.borderColorId)

        if (stylePaletteChanged) {
          backgroundColorIndex = remapIfInherited(
            storedPaletteOverride(previousStyleEffective, next.backgroundColorPaletteId),
            backgroundColorIndex,
            nextStyleEffective,
          )
          textColorIndexNext = remapIfInherited(
            storedPaletteOverride(previousStyleEffective, next.textColorPaletteId),
            textColorIndexNext,
            nextStyleEffective,
          )
          borderColorIndex = remapIfInherited(
            storedPaletteOverride(previousStyleEffective, next.borderColorPaletteId),
            borderColorIndex,
            nextStyleEffective,
          )
        }

        const draft = applyButtonBasicToDraft(values, labelStyle, {
          name: next.name,
          fontId: next.fontId,
          colorPaletteId: nextStylePaletteId,
          backgroundColorPaletteId: storedPaletteOverride(nextStyleEffective, next.backgroundColorPaletteId),
          textColorPaletteId: storedPaletteOverride(nextStyleEffective, next.textColorPaletteId),
          borderColorPaletteId: storedPaletteOverride(nextStyleEffective, next.borderColorPaletteId),
          backgroundColorIndex,
          textColorIndex: textColorIndexNext,
          borderColorIndex,
          textSize: next.textSize,
          borderWidth: next.borderWidth,
          radius: next.radius,
        })
        onDraftChange(draft.button, draft.labelStyle)
      }}
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
      generalView={generalView}
    />
  )
}
