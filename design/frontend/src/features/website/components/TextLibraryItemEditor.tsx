import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { websiteColorLibraryActions, websiteFontLibraryActions } from '../store'
import type { WebsiteTextLibraryItem } from '../types'
import {
  findColorOptionId,
  flattenColorLibraryPalettes,
  formatPaletteScopedColorLabel,
  inferLibraryPaletteId,
  libraryPaletteColorValues,
} from '../utils/colorLibraryPalette'
import { themeFontFamilyStyle } from '../utils/themeFontPreview'
import {
  defaultElementHtml,
  normalizeWebsiteElementCustomization,
  withPaletteColors,
} from '../utils/websiteElementCustomization'
import { TextStyleBasicSettingsFields } from './TextStyleBasicSettingsFields'
import { usableLibraryItems } from './WebsitePublishStatus'
import { WebsiteElementCustomizationPreview } from './WebsiteElementCustomizationPreview'
import {
  WebsiteElementEditorTabs,
  type WebsiteElementEditorTab,
} from './WebsiteElementEditorTabs'

export function TextLibraryItemEditor({
  item,
  onEdit,
}: {
  item: WebsiteTextLibraryItem
  onEdit: (tab: WebsiteElementEditorTab) => void
}) {
  const { t } = useTranslation('website')
  const dispatch = useAppDispatch()
  const fonts = useAppSelector((state) => state.websiteFontLibrary)
  const colorLibrary = useAppSelector((state) => state.websiteColorLibrary)
  const colorOptions = useMemo(() => flattenColorLibraryPalettes(colorLibrary.items), [colorLibrary.items])
  const [fontId, setFontId] = useState('')
  const [colorPaletteId, setColorPaletteId] = useState('')
  const [colorId, setColorId] = useState('')
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
      (entry) => entry.googleFontUrl === d.googleFontUrl || entry.family === d.family,
    )
    if (font) setFontId(font.id)
    if (colorOptions.length > 0) {
      const nextColor = findColorOptionId(d.colorValue, colorOptions)
      setColorId(nextColor)
      setColorPaletteId(inferLibraryPaletteId(colorOptions, [nextColor]))
    }
  }, [colorOptions, fonts.items, item])

  const previewSample = t('textPreviewSample')
  const d = item.definition
  const font = fonts.items.find((entry) => entry.id === fontId)
  const previewBaseStyle = {
    fontFamily: font?.family ?? d.family,
    fontSize: d.size,
    color: d.colorValue,
  }
  const elementVisual = withPaletteColors(
    {
      color: previewBaseStyle.color,
      fontFamily: previewBaseStyle.fontFamily,
      fontSize: previewBaseStyle.fontSize,
    },
    libraryPaletteColorValues(colorLibrary.items, colorPaletteId),
  )
  const defaultHtml = defaultElementHtml('text', item.id, elementVisual)
  const resolvedFontId = fontId || 'definition-font'

  const generalView = (
    <TextStyleBasicSettingsFields
      mode="view"
      idPrefix="library-text"
      values={{
        name: item.name,
        fontId: resolvedFontId,
        colorPaletteId,
        colorId,
        size: d.size,
      }}
      fontOptions={[
        ...usableLibraryItems(fonts.items, [fontId]).map((fontItem) => ({
          id: fontItem.id,
          label: fontItem.name,
          fontFamily: fontItem.family,
        })),
        ...(!fontId && d.fontName ? [{ id: 'definition-font', label: d.fontName, fontFamily: d.family }] : []),
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
      kind="text"
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
          kind="text"
          customization={customization}
          placeholders={{ content: previewSample }}
          defaultHtml={defaultHtml}
          visual={elementVisual}
          baseStyle={previewBaseStyle}
          className="min-h-[2rem] whitespace-pre-wrap"
          fallback={
            <p className="truncate" style={{ ...previewBaseStyle, ...themeFontFamilyStyle(font?.family ?? '') }}>
              {previewSample}
            </p>
          }
        />
      }
    />
  )
}
