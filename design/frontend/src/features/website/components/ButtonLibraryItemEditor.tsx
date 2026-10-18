import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReadOnlyField } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { buttonLabelTypography } from '../document/theme'
import { websiteColorLibraryActions, websiteFontLibraryActions } from '../store'
import type { WebsiteButtonLibraryItem } from '../types'
import {
  findColorOptionId,
  flattenColorLibraryPalettes,
  type FlattenedLibraryColor,
} from '../utils/colorLibraryPalette'
import {
  defaultElementHtml,
  normalizeWebsiteElementCustomization,
} from '../utils/websiteElementCustomization'
import { WebsiteElementCustomizationPreview } from './WebsiteElementCustomizationPreview'
import {
  WebsiteElementEditorTabs,
  type WebsiteElementEditorTab,
} from './WebsiteElementEditorTabs'

function colorOptionLabel(color: FlattenedLibraryColor, slotLabel: string) {
  return `${color.paletteName} · ${slotLabel} (${color.value})`
}

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
  const [labelColorId, setLabelColorId] = useState('')
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
      setTextColorId(findColorOptionId(d.textColorValue, colorOptions))
      setBorderColorId(findColorOptionId(d.borderColorValue, colorOptions))
      setLabelColorId(findColorOptionId(d.labelColorValue, colorOptions))
    }
  }, [colorOptions, fonts.items, item])

  const previewLabel = t('buttonPreviewLabel')
  const d = item.definition
  const font = fonts.items.find((entry) => entry.id === fontId)
  const previewBaseStyle = {
    ...buttonLabelTypography(),
    background: d.backgroundColorValue,
    color: d.textColorValue,
    border: `${d.borderWidth}px solid ${d.borderColorValue}`,
    borderRadius: d.radius,
    fontFamily: font?.family ?? d.textFontFamily,
    fontSize: d.textSize,
  }
  const elementVisual = {
    background: previewBaseStyle.background,
    color: previewBaseStyle.color,
    border: previewBaseStyle.border,
    borderRadius: previewBaseStyle.borderRadius,
    fontFamily: previewBaseStyle.fontFamily,
    fontSize: previewBaseStyle.fontSize,
    lineHeight: 1,
  }
  const defaultHtml = defaultElementHtml('button', item.id, elementVisual)

  function colorReadout(optionId: string) {
    const color = colorOptions.find((entry) => entry.optionId === optionId)
    if (!color) return '—'
    return (
      <span className="inline-flex items-center gap-2">
        <span
          className="h-4 w-4 shrink-0 rounded-sm border border-[hsl(var(--glass-border))]"
          style={{ backgroundColor: color.value }}
          aria-hidden
        />
        {colorOptionLabel(color, t('paletteColorSlot', { index: color.slot }))}
      </span>
    )
  }

  const generalView = (
    <div className="space-y-4">
      <ReadOnlyField label={t('styleName')} value={item.name} />
      <ReadOnlyField label={t('fontType')} value={font?.name ?? d.textFontName} />
      <ReadOnlyField label={t('backgroundColor')} value={colorReadout(backgroundColorId)} />
      <ReadOnlyField label={t('textColor')} value={colorReadout(textColorId)} />
      <ReadOnlyField label={t('labelTextColor')} value={colorReadout(labelColorId)} />
      <ReadOnlyField label={t('borderColor')} value={colorReadout(borderColorId)} />
      <div className="grid grid-cols-3 gap-3">
        <ReadOnlyField label={t('textSize')} value={String(d.textSize)} />
        <ReadOnlyField label={t('borderWidth')} value={String(d.borderWidth)} />
        <ReadOnlyField label={t('radius')} value={String(d.radius)} />
      </div>
    </div>
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
