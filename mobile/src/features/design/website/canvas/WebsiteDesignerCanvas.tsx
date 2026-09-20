import { useRef } from 'react'
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native'
import { useThemeColors } from '@webonone/mobile-ui'
import { WebsiteBlockView } from '@/features/design/website/canvas/WebsiteBlockView'
import {
  DesignerCanvasDragProvider,
  useCanvasPreviewContainerHeight,
} from '@/features/design/website/canvas/DesignerCanvasDragContext'
import { CanvasColumnGrid, CanvasRowGrid, SelectionFrame } from '@/features/design/website/canvas/selectionFrame'
import { canvasScale } from '@/features/design/website/canvas/layoutStyle'
import {
  documentContentHeight,
  minContainerHeightForDesignerKind,
  ROW_HEIGHT,
} from '@/features/design/website/document/layout'
import type {
  DesignerMode,
  DesignerSelection,
  WebsiteBreakpoint,
  WebsiteDesignerKind,
  WebsiteDocumentV1,
  WebsiteTheme,
} from '@/features/design/website/types'

interface WebsiteDesignerCanvasProps {
  document: WebsiteDocumentV1
  breakpoint: WebsiteBreakpoint
  theme: WebsiteTheme | null
  selection: DesignerSelection
  kind?: WebsiteDesignerKind
  mode?: DesignerMode
  headerDocument?: WebsiteDocumentV1 | null
  footerDocument?: WebsiteDocumentV1 | null
  onSelect: (selection: DesignerSelection) => void
  onDocumentChange?: (document: WebsiteDocumentV1) => void
}

export function WebsiteDesignerCanvas({
  document,
  breakpoint,
  theme,
  selection,
  kind,
  mode = 'edit',
  headerDocument,
  footerDocument,
  onSelect,
  onDocumentChange,
}: WebsiteDesignerCanvasProps) {
  const { width } = useWindowDimensions()
  const canvasWidth = Math.min(width - 24, 720)
  const scale = canvasScale(canvasWidth, breakpoint)
  const interactive = mode === 'edit'
  const headerHeight =
    mode === 'visual' && headerDocument ? documentContentHeight(headerDocument, breakpoint) * scale : 0
  const footerHeight =
    mode === 'visual' && footerDocument ? documentContentHeight(footerDocument, breakpoint) * scale : 0
  const canDrag = interactive && Boolean(onDocumentChange)
  const scrollRef = useRef<ScrollView>(null)

  return (
    <DesignerCanvasDragProvider
      document={document}
      breakpoint={breakpoint}
      canvasWidth={canvasWidth}
      scale={scale}
      interactive={canDrag}
      scrollRef={scrollRef}
      onDocumentChange={onDocumentChange ?? (() => undefined)}
      onSelect={onSelect}
    >
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="items-center py-3"
        keyboardShouldPersistTaps="handled"
        directionalLockEnabled
      >
        {headerHeight > 0 && headerDocument ? (
          <CanvasPage
            document={headerDocument}
            breakpoint={breakpoint}
            theme={theme}
            selection={selection}
            canvasWidth={canvasWidth}
            scale={scale}
            height={headerHeight}
            interactive={false}
            showGrid={false}
            onSelect={onSelect}
          />
        ) : null}
        <CanvasPage
          document={document}
          breakpoint={breakpoint}
          theme={theme}
          selection={selection}
          kind={kind}
          canvasWidth={canvasWidth}
          scale={scale}
          interactive={interactive}
          showGrid={interactive}
          onSelect={onSelect}
        />
        {footerHeight > 0 && footerDocument ? (
          <CanvasPage
            document={footerDocument}
            breakpoint={breakpoint}
            theme={theme}
            selection={selection}
            canvasWidth={canvasWidth}
            scale={scale}
            height={footerHeight}
            interactive={false}
            showGrid={false}
            onSelect={onSelect}
          />
        ) : null}
        <View className="h-8" />
      </ScrollView>
    </DesignerCanvasDragProvider>
  )
}

function CanvasPage({
  document,
  breakpoint,
  theme,
  selection,
  kind,
  canvasWidth,
  scale,
  height,
  interactive,
  showGrid,
  onSelect,
}: {
  document: WebsiteDocumentV1
  breakpoint: WebsiteBreakpoint
  theme: WebsiteTheme | null
  selection: DesignerSelection
  kind?: WebsiteDesignerKind
  canvasWidth: number
  scale: number
  height?: number
  interactive: boolean
  showGrid: boolean
  onSelect: (selection: DesignerSelection) => void
}) {
  const colors = useThemeColors()
  const minHeight = minContainerHeightForDesignerKind(kind)
  const previewHeight = useCanvasPreviewContainerHeight()
  const logicalHeight = previewHeight ?? document.container.height
  const pageHeight = height ?? Math.max(logicalHeight * scale, minHeight * scale, 240)
  const selected = interactive && selection.kind === 'container'
  const blocks = [...document.blocks].sort((a, b) => a.zIndex - b.zIndex)
  const pageBackground = document.container.backgroundColor || theme?.pageBackground || '#ffffff'

  return (
    <Pressable
      onPress={() => {
        if (interactive) onSelect({ kind: 'container' })
      }}
      style={{
        width: canvasWidth,
        height: pageHeight,
        position: 'relative',
        backgroundColor: pageBackground,
        overflow: interactive ? 'visible' : 'hidden',
      }}
    >
      {showGrid ? (
        <>
          <CanvasColumnGrid />
          <CanvasRowGrid heightPx={pageHeight} rowHeightPx={ROW_HEIGHT * scale} />
        </>
      ) : null}
      {blocks.map((block) => (
        <WebsiteBlockView
          key={block.id}
          block={block}
          breakpoint={breakpoint}
          parentWidth={canvasWidth}
          scale={scale}
          theme={theme}
          selection={selection}
          interactive={interactive}
          onSelect={onSelect}
        />
      ))}
      {selected ? <SelectionFrame color={colors.primary} /> : null}
    </Pressable>
  )
}
