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
  libraryPaletteColorValues,
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
  const [colorPaletteId, setColorPaletteId] = useState('')
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
      const nextBackground = findColorOptionId(d.backgroundColorValue, colorOptions)
      const nextText =
        findColorOptionId(d.labelColorValue, colorOptions) || findColorOptionId(d.textColorValue, colorOptions)
      const nextBorder = findColorOptionId(d.borderColorValue, colorOptions)
      setBackgroundColorId(nextBackground)
      setTextColorId(nextText)
      setBorderColorId(nextBorder)
      setColorPaletteId(inferLibraryPaletteId(colorOptions, [nextBackground, nextText, nextBorder]))
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
    libraryPaletteColorValues(colorLibrary.items, colorPaletteId),
  )
  const defaultHtml = defaultElementHtml('button', item.id, elementVisual)

  const resolvedFontId = fontId || 'definition-font'
  const generalView = (
    <ButtonStyleBasicSettingsFields
      mode="view"
      idPrefix="library-button"
      values={{
        name: item.name,
        fontId: resolvedFontId,
        colorPaletteId,
        backgroundColorId,
        textColorId,
        borderColorId,
        textSize: d.textSize,
        borderWidth: d.borderWidth,
        radius: d.radius,
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
      paletteOptions={usableLibraryItems(colorLibrary.items, [colorPaletteId]).map((libraryItem) => ({
        id: libraryItem.id,
        name: libraryItem.name,
        palette: libraryItem.palette,
      }))}
      colorOptions={colorOptions
        .filter((color) => !colorPaletteId || color.paletteId === colorPaletteId)
        .map((color) => ({
          id: color.optionId,
          label: formatPaletteScopedColorLabel(color, t('paletteColorSlot', { index: color.slot })),
          swatch: color.value,
        }))}
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
