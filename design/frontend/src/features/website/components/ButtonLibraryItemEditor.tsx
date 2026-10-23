import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { buttonLabelTypography } from '../document/theme'
import { websiteColorLibraryActions, websiteFontLibraryActions } from '../store'
import type { WebsiteButtonLibraryItem } from '../types'
import {
  findColorOptionId,
  flattenColorLibraryPalettes,
  formatPaletteScopedColorLabel,
  inferLibraryPaletteId,
  libraryPaletteIdFromOptionId,
  libraryPerColorPaletteUi,
  libraryPreviewPaletteValues,
} from '../utils/colorLibraryPalette'
import {
  defaultElementHtml,
  normalizeWebsiteElementCustomization,
  withPaletteColors,
} from '../utils/websiteElementCustomization'
import { ButtonStyleBasicSettingsFields } from './ButtonStyleBasicSettingsFields'
import { usableLibraryItems } from './WebsitePublishStatus'
import { WebsiteElementCustomizationPreview } from './WebsiteElementCustomizationPreview'
import {
  WebsiteElementEditorTabs,
  type WebsiteElementEditorTab,
} from './WebsiteElementEditorTabs'

export function ButtonLibraryItemEditor({
  item,
  onEdit,
}: {
  item: WebsiteButtonLibraryItem
  onEdit: (tab: WebsiteElementEditorTab) => void
}) {
  const { t } = useTranslation('website')
  const dispatch = useAppDispatch()
  const fonts = useAppSelector((state) => state.websiteFontLibrary)
  const colorLibrary = useAppSelector((state) => state.websiteColorLibrary)
  const colorOptions = useMemo(() => flattenColorLibraryPalettes(colorLibrary.items), [colorLibrary.items])
  const [fontId, setFontId] = useState('')
  const [backgroundColorId, setBackgroundColorId] = useState('')
  const [textColorId, setTextColorId] = useState('')
  const [borderColorId, setBorderColorId] = useState('')
  const [elementTab, setElementTab] = useState<WebsiteElementEditorTab>('general')
  const customization = normalizeWebsiteElementCustomization(item.definition.customization)

  useEffect(() => {
    dispatch(websiteFontLibraryActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    dispatch(websiteColorLibraryActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
  }, [dispatch, item.id])

  useEffect(() => {
    setElementTab('general')
  }, [item.id])

  useEffect(() => {
    const d = item.definition
    const font = fonts.items.find(
      (entry) => entry.googleFontUrl === d.textGoogleFontUrl || entry.family === d.textFontFamily,
    )
    if (font) setFontId(font.id)
    if (colorOptions.length > 0) {
      setBackgroundColorId(findColorOptionId(d.backgroundColorValue, colorOptions))
      setTextColorId(
        findColorOptionId(d.labelColorValue, colorOptions) || findColorOptionId(d.textColorValue, colorOptions),
      )
      setBorderColorId(findColorOptionId(d.borderColorValue, colorOptions))
    }
  }, [colorOptions, fonts.items, item])

  const previewLabel = t('buttonPreviewLabel')
  const d = item.definition
  const font = fonts.items.find((entry) => entry.id === fontId)
  const previewBaseStyle = {
    ...buttonLabelTypography(),
    background: d.backgroundColorValue,
    color: d.labelColorValue,
    border: `${d.borderWidth}px solid ${d.borderColorValue}`,
    borderRadius: d.radius,
    fontFamily: font?.family ?? d.textFontFamily,
    fontSize: d.textSize,
  }
  const elementVisual = withPaletteColors(
    {
      background: previewBaseStyle.background,
      color: previewBaseStyle.color,
      border: previewBaseStyle.border,
      borderRadius: previewBaseStyle.borderRadius,
      fontFamily: previewBaseStyle.fontFamily,
      fontSize: previewBaseStyle.fontSize,
      lineHeight: 1,
    },
    libraryPreviewPaletteValues(colorLibrary.items, colorOptions, [
      backgroundColorId,
      textColorId,
      borderColorId,
    ]),
  )
  const defaultHtml = defaultElementHtml('button', item.id, elementVisual)

  const resolvedFontId = fontId || 'definition-font'
  const libraryStyleDefaultPaletteId = colorLibrary.items[0]?.id ?? ''
  const elementPalette = inferLibraryPaletteId(colorOptions, [
    backgroundColorId,
    textColorId,
    borderColorId,
  ])
  const styleEffective = elementPalette || libraryStyleDefaultPaletteId
  const libraryInheritPaletteName = colorLibrary.items.find((entry) => entry.id === styleEffective)?.name
  const libraryPerColorPaletteNoneLabel = libraryInheritPaletteName
    ? t('inheritColorPaletteNamed', { name: libraryInheritPaletteName })
    : t('inheritColorPalette')
  const libraryColorFieldOptions = colorOptions.map((color) => ({
    id: color.optionId,
    label: formatPaletteScopedColorLabel(color, t('paletteColorSlot', { index: color.slot })),
    swatch: color.value,
    paletteId: color.paletteId,
  }))
  const generalView = (
    <ButtonStyleBasicSettingsFields
      mode="view"
      idPrefix="library-button"
      values={{
        name: item.name,
        fontId: resolvedFontId,
        styleColorPaletteId: libraryPerColorPaletteUi(elementPalette, '', libraryStyleDefaultPaletteId),
        backgroundColorPaletteId: libraryPerColorPaletteUi(
          libraryPaletteIdFromOptionId(colorOptions, backgroundColorId),
          styleEffective,
          libraryStyleDefaultPaletteId,
        ),
        backgroundColorId,
        textColorPaletteId: libraryPerColorPaletteUi(
          libraryPaletteIdFromOptionId(colorOptions, textColorId),
          styleEffective,
          libraryStyleDefaultPaletteId,
        ),
        textColorId,
        borderColorPaletteId: libraryPerColorPaletteUi(
          libraryPaletteIdFromOptionId(colorOptions, borderColorId),
          styleEffective,
          libraryStyleDefaultPaletteId,
        ),
        borderColorId,
        textSize: d.textSize,
        borderWidth: d.borderWidth,
        radius: d.radius,
      }}
      styleDefaultPaletteId={libraryStyleDefaultPaletteId}
      perColorPaletteNoneLabel={libraryPerColorPaletteNoneLabel}
      getColorOptionsForPalette={(paletteId) => {
        const effective = paletteId.trim() || styleEffective
        return libraryColorFieldOptions.filter((entry) => entry.paletteId === effective)
      }}
      fontOptions={[
        ...usableLibraryItems(fonts.items, [fontId]).map((fontItem) => ({
          id: fontItem.id,
          label: fontItem.name,
          fontFamily: fontItem.family,
        })),
        ...(!fontId && d.textFontName
          ? [{ id: 'definition-font', label: d.textFontName, fontFamily: d.textFontFamily }]
          : []),
      ]}
      paletteOptions={usableLibraryItems(colorLibrary.items, [
        libraryPaletteIdFromOptionId(colorOptions, backgroundColorId),
        libraryPaletteIdFromOptionId(colorOptions, textColorId),
        libraryPaletteIdFromOptionId(colorOptions, borderColorId),
      ]).map((libraryItem) => ({
        id: libraryItem.id,
        name: libraryItem.name,
        palette: libraryItem.palette,
      }))}
      colorOptions={libraryColorFieldOptions}
    />
  )

  return (
    <WebsiteElementEditorTabs
      tab={elementTab}
      onTabChange={setElementTab}
      kind="button"
      layout="detail"
      mode="view"
      onEdit={onEdit}
      scopeId={item.id}
      customization={customization}
      defaultHtml={defaultHtml}
      visual={elementVisual}
      onCustomizationChange={() => undefined}
      generalView={generalView}
      general={generalView}
      preview={
        <WebsiteElementCustomizationPreview
          scopeId={item.id}
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
    />
  )
}
