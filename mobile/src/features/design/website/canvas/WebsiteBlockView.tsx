import { useState } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useThemeColors } from '@webonone/mobile-ui'
import { WebsiteAddonView } from '@/features/design/website/canvas/WebsiteAddonView'
import { CanvasDraggable } from '@/features/design/website/canvas/CanvasDraggable'
import {
  addonSelectionGrabbed,
  blockSelectionGrabbed,
  canCaptureMove,
  designerSelectionKey,
} from '@/features/design/website/canvas/canvasSelection'
import { useCanvasPreviewRect } from '@/features/design/website/canvas/DesignerCanvasDragContext'
import { SelectionChrome } from '@/features/design/website/canvas/SelectionChrome'
import { CanvasRowGrid, SelectionFrame } from '@/features/design/website/canvas/selectionFrame'
import { elementChromeStyle, layoutRectStyle } from '@/features/design/website/canvas/layoutStyle'
import { resolveLayoutRect, ROW_HEIGHT } from '@/features/design/website/document/layout'
import {
  resolveSliderDisplaySettings,
  resolveSliderItems,
  resolveSliderSlideBlock,
} from '@/features/design/website/document/slider'
import type {
  DesignerSelection,
  WebsiteAddon,
  WebsiteBlock,
  WebsiteBreakpoint,
  WebsiteTheme,
} from '@/features/design/website/types'

interface WebsiteBlockViewProps {
  block: WebsiteBlock
  breakpoint: WebsiteBreakpoint
  parentWidth: number
  scale: number
  theme: WebsiteTheme | null
  selection: DesignerSelection
  interactive: boolean
  slideShell?: boolean
  templateHost?: { hostBlockId: string; sliderAddonId: string }
  /** Page or template ancestor is selected — children defer drag like web. */
  ancestorSelected?: boolean
  onSelect: (selection: DesignerSelection) => void
}

export function WebsiteBlockView({
  block,
  breakpoint,
  parentWidth,
  scale,
  theme,
  selection,
  interactive,
  slideShell = false,
  templateHost,
  ancestorSelected = false,
  onSelect,
}: WebsiteBlockViewProps) {
  const colors = useThemeColors()
  const resolved = resolveLayoutRect(block.layout, breakpoint)
  const blockGrabbed = blockSelectionGrabbed(block.id, templateHost, slideShell)
  const previewRect = useCanvasPreviewRect(designerSelectionKey(blockGrabbed))
  const rect = !slideShell && previewRect ? previewRect : resolved
  const selected = interactive && isBlockSelected(block.id, selection, templateHost, slideShell)
  const childSelected =
    interactive &&
    (isChildAddonSelected(block, selection, templateHost) ||
      isChildBlockSelected(block, selection))
  const children = [...(block.children ?? [])].sort((a, b) => a.zIndex - b.zIndex)
  const addons = [...block.addons].sort((a, b) => a.zIndex - b.zIndex)
  const sliderHostSelected =
    Boolean(templateHost) &&
    selection.kind === 'addon' &&
    selection.addonId === templateHost?.sliderAddonId
  const captureMove = canCaptureMove({
    interactive,
    slideShell,
    ancestorSelected,
    sliderHostSelected,
  })
  const lockChildren = selected || ancestorSelected || sliderHostSelected

  const layoutStyle = slideShell
    ? { flex: 1, position: 'relative' as const }
    : {
        ...layoutRectStyle(
          rect,
          parentWidth,
          scale,
          selected || childSelected ? 10000 + block.zIndex : block.zIndex,
        ),
        overflow: selected || childSelected ? ('visible' as const) : ('hidden' as const),
      }

  return (
    <CanvasDraggable
      grabbed={blockGrabbed}
      captureMove={captureMove}
      stealFromChildren={selected}
      onTap={() => onSelect(blockGrabbed)}
      style={[layoutStyle, !slideShell ? elementChromeStyle(block) : null]}
    >
      {interactive && !slideShell ? (
        <CanvasRowGrid
          heightPx={rect.height * scale}
          rowHeightPx={ROW_HEIGHT * scale}
          borderColor="rgba(0,0,0,0.12)"
        />
      ) : null}
      {children.map((child) => (
        <WebsiteBlockView
          key={child.id}
          block={child}
          breakpoint={breakpoint}
          parentWidth={parentWidth}
          scale={scale}
          theme={theme}
          selection={selection}
          interactive={interactive}
          templateHost={templateHost}
          ancestorSelected={lockChildren}
          onSelect={onSelect}
        />
      ))}
      {addons.map((addon) => (
        <AddonNode
          key={addon.id}
          addon={addon}
          blockId={block.id}
          breakpoint={breakpoint}
          parentWidth={parentWidth}
          scale={scale}
          theme={theme}
          selection={selection}
          interactive={interactive}
          templateHost={templateHost}
          blockSelected={selected}
          ancestorSelected={lockChildren}
          onSelect={onSelect}
        />
      ))}
      {selected && !slideShell ? <SelectionFrame color={colors.primary} /> : null}
      {selected && !slideShell && interactive ? (
        <SelectionChrome grabbed={blockGrabbed} color={colors.primary} />
      ) : null}
    </CanvasDraggable>
  )
}

function AddonNode({
  addon,
  blockId,
  breakpoint,
  parentWidth,
  scale,
  theme,
  selection,
  interactive,
  templateHost,
  blockSelected,
  ancestorSelected,
  onSelect,
}: {
  addon: WebsiteAddon
  blockId: string
  breakpoint: WebsiteBreakpoint
  parentWidth: number
  scale: number
  theme: WebsiteTheme | null
  selection: DesignerSelection
  interactive: boolean
  templateHost?: { hostBlockId: string; sliderAddonId: string }
  blockSelected: boolean
  ancestorSelected: boolean
  onSelect: (selection: DesignerSelection) => void
}) {
  const colors = useThemeColors()
  const resolved = resolveLayoutRect(addon.layout, breakpoint)
  const addonGrabbed = addonSelectionGrabbed(blockId, addon.id, templateHost)
  const previewRect = useCanvasPreviewRect(designerSelectionKey(addonGrabbed))
  const rect = previewRect ?? resolved
  const addonSelected = interactive && isAddonSelected(addon.id, selection, templateHost)
  const templateChildSelected =
    (selection.kind === 'templateBlock' || selection.kind === 'templateAddon') &&
    selection.sliderAddonId === addon.id
  const captureMove = interactive && !ancestorSelected && !blockSelected
  const addonWidth = (rect.colSpan / 12) * parentWidth
  const clipSlider = addon.type === 'slider' && !templateChildSelected

  return (
    <CanvasDraggable
      grabbed={addonGrabbed}
      captureMove={captureMove}
      stealFromChildren={addonSelected}
      onTap={() => onSelect(addonGrabbed)}
      style={[
        layoutRectStyle(
          rect,
          parentWidth,
          scale,
          addonSelected || templateChildSelected ? 10000 + addon.zIndex : addon.zIndex + 2,
        ),
        { overflow: clipSlider ? 'hidden' : 'visible' },
      ]}
    >
      {addon.type === 'slider' ? (
        <SliderCanvas
          addon={addon}
          breakpoint={breakpoint}
          theme={theme}
          selected={addonSelected}
          interactive={interactive}
          hostBlockId={templateHost?.hostBlockId ?? blockId}
          parentWidth={addonWidth}
          scale={scale}
          selection={selection}
          nestedLocked={ancestorSelected || blockSelected}
          onSelect={onSelect}
        />
      ) : (
        <WebsiteAddonView
          addon={addon}
          breakpoint={breakpoint}
          theme={theme}
        />
      )}
      {addonSelected && !templateChildSelected ? (
        <SelectionFrame color={colors.secondary} />
      ) : null}
      {addonSelected && !templateChildSelected && interactive ? (
        <SelectionChrome grabbed={addonGrabbed} color={colors.secondary} />
      ) : null}
    </CanvasDraggable>
  )
}

function SliderCanvas({
  addon,
  breakpoint,
  theme,
  selected,
  interactive,
  hostBlockId,
  parentWidth,
  scale,
  selection,
  nestedLocked,
  onSelect,
}: {
  addon: Extract<WebsiteAddon, { type: 'slider' }>
  breakpoint: WebsiteBreakpoint
  theme: WebsiteTheme | null
  selected: boolean
  interactive: boolean
  hostBlockId: string
  parentWidth: number
  scale: number
  selection: DesignerSelection
  nestedLocked: boolean
  onSelect: (selection: DesignerSelection) => void
}) {
  const { t } = useTranslation('website')
  const [viewportWidth, setViewportWidth] = useState(parentWidth)
  const template = addon.props.slideTemplate
  const display = resolveSliderDisplaySettings(addon.props, breakpoint)
  const items = resolveSliderItems({
    dataSource: addon.props.dataSource,
    datasetId: addon.props.datasetId,
    itemsPath: addon.props.itemsPath,
    manualSlides: addon.props.manualSlides,
  })
  const slideRoot = template
    ? resolveSliderSlideBlock(template, addon.props.itemGroup, {
        authoring: interactive && items.length === 0,
      })
    : null

  if (!template || !slideRoot) {
    return (
      <View
        pointerEvents="none"
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: 'rgba(0,0,0,0.25)',
          paddingHorizontal: 12,
        }}
      >
        <Text style={{ color: '#6b7280', fontSize: 12, textAlign: 'center' }}>
          {t('sliderEmptyTemplate')}
        </Text>
      </View>
    )
  }

  const slotWidth = Math.max(1, viewportWidth || parentWidth)
  const nestedHost = { hostBlockId, sliderAddonId: addon.id }

  return (
    <View
      onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
      style={{ flex: 1, overflow: selected ? 'hidden' : 'visible' }}
    >
      <View style={{ width: slotWidth, flex: 1, overflow: selected ? 'hidden' : 'visible' }}>
        <WebsiteBlockView
          block={slideRoot}
          breakpoint={breakpoint}
          parentWidth={slotWidth}
          scale={scale}
          theme={theme}
          selection={selection}
          interactive={interactive}
          slideShell
          templateHost={nestedHost}
          ancestorSelected={nestedLocked}
          onSelect={onSelect}
        />
      </View>
      {display.showNavigation && items.length > 1 ? (
        <View
          pointerEvents="none"
          className="absolute bottom-2 left-0 right-0 flex-row items-center justify-center gap-1"
        >
          {items.slice(0, 8).map((_item, index) => (
            <View
              key={`${addon.id}-dot-${index}`}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: index === 0 ? '#111827' : 'rgba(17,24,39,0.3)',
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}

function isBlockSelected(
  blockId: string,
  selection: DesignerSelection,
  templateHost?: { hostBlockId: string; sliderAddonId: string },
  slideShell?: boolean,
) {
  if (slideShell) return false
  if (templateHost) {
    return (
      selection.kind === 'templateBlock' &&
      selection.templateBlockId === blockId &&
      selection.sliderAddonId === templateHost.sliderAddonId
    )
  }
  return selection.kind === 'block' && selection.blockId === blockId
}

function isAddonSelected(
  addonId: string,
  selection: DesignerSelection,
  templateHost?: { hostBlockId: string; sliderAddonId: string },
) {
  if (templateHost) {
    return (
      selection.kind === 'templateAddon' &&
      selection.templateAddonId === addonId &&
      selection.sliderAddonId === templateHost.sliderAddonId
    )
  }
  return selection.kind === 'addon' && selection.addonId === addonId
}

function isChildAddonSelected(
  block: WebsiteBlock,
  selection: DesignerSelection,
  templateHost?: { hostBlockId: string; sliderAddonId: string },
) {
  return block.addons.some(
    (addon) =>
      isAddonSelected(addon.id, selection, templateHost) ||
      ((selection.kind === 'templateBlock' || selection.kind === 'templateAddon') &&
        selection.sliderAddonId === addon.id),
  )
}

function isChildBlockSelected(block: WebsiteBlock, selection: DesignerSelection): boolean {
  if (selection.kind !== 'block') return false
  return (block.children ?? []).some(
    (child) => child.id === selection.blockId || isChildBlockSelected(child, selection),
  )
}
