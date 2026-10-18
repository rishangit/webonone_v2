import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReadOnlyField } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { websiteColorLibraryActions, websiteFontLibraryActions } from '../store'
import type { WebsiteTextLibraryItem } from '../types'
import { findColorOptionId, flattenColorLibraryPalettes } from '../utils/colorLibraryPalette'
import { themeFontFamilyStyle } from '../utils/themeFontPreview'
import {
  defaultElementHtml,
  normalizeWebsiteElementCustomization,
} from '../utils/websiteElementCustomization'
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
  const colors = useAppSelector((state) => state.websiteColorLibrary)
  const colorOptions = useMemo(() => flattenColorLibraryPalettes(colors.items), [colors.items])
  const [fontId, setFontId] = useState('')
  const [colorOptionId, setColorOptionId] = useState('')
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
      setColorOptionId(findColorOptionId(d.colorValue, colorOptions))
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
  const elementVisual = {
    color: previewBaseStyle.color,
    fontFamily: previewBaseStyle.fontFamily,
    fontSize: previewBaseStyle.fontSize,
  }
  const defaultHtml = defaultElementHtml('text', item.id, elementVisual)

  function colorReadout(optionId: string) {
    const selected = colorOptions.find((entry) => entry.optionId === optionId)
    if (!selected) return '—'
    return (
      <span className="inline-flex items-center gap-2">
        <span
          className="h-4 w-4 shrink-0 rounded-sm border border-[hsl(var(--glass-border))]"
          style={{ backgroundColor: selected.value }}
          aria-hidden
        />
        {selected.paletteName} · {t('paletteColorSlot', { index: selected.slot })} ({selected.value})
      </span>
    )
  }

  const generalView = (
    <div className="space-y-4">
      <ReadOnlyField label={t('styleName')} value={item.name} />
      <ReadOnlyField label={t('fontType')} value={font?.name ?? d.fontName} />
      <ReadOnlyField label={t('fontColor')} value={colorReadout(colorOptionId)} />
      <ReadOnlyField label={t('sizeLg')} value={String(d.size)} />
    </div>
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
