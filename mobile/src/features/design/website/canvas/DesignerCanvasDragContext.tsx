import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import type { ScrollView } from 'react-native'
import {
  applyCanvasDragSession,
  applyCanvasPinchSession,
  createCanvasDragSession,
  dragSessionRect,
  pinchSessionRect,
  type CanvasDragSession,
} from '@/features/design/website/canvas/designerCanvasDrag'
import { designerSelectionKey } from '@/features/design/website/canvas/canvasSelection'
import {
  layoutRectsEqual,
  pinchScaleFromSpans,
  ROW_HEIGHT,
  type PinchSpans,
  type ResizeHandle,
} from '@/features/design/website/document/layout'
import type { DesignerSelection, LayoutRect, WebsiteBreakpoint, WebsiteDocumentV1 } from '@/features/design/website/types'

export type CanvasDragPreview = {
  key: string
  rect: LayoutRect
  containerHeight: number | null
}

type DesignerCanvasDragActions = {
  begin: (handle: ResizeHandle | 'move', grabbed: DesignerSelection) => void
  beginPinch: (grabbed: DesignerSelection, spans: PinchSpans) => void
  move: (dx: number, dy: number) => void
  pinch: (spans: PinchSpans) => void
  end: () => void
}

const DesignerCanvasDragActionsContext = createContext<DesignerCanvasDragActions | null>(null)
const DesignerCanvasPreviewContext = createContext<CanvasDragPreview | null>(null)

export function DesignerCanvasDragProvider({
  document,
  breakpoint,
  canvasWidth,
  scale,
  interactive,
  scrollRef,
  onDocumentChange,
  onSelect,
  children,
}: {
  document: WebsiteDocumentV1
  breakpoint: WebsiteBreakpoint
  canvasWidth: number
  scale: number
  interactive: boolean
  scrollRef?: MutableRefObject<ScrollView | null>
  onDocumentChange: (document: WebsiteDocumentV1) => void
  onSelect: (selection: DesignerSelection) => void
  children: ReactNode
}) {
  const documentRef = useRef(document)
  documentRef.current = document
  const onDocumentChangeRef = useRef(onDocumentChange)
  onDocumentChangeRef.current = onDocumentChange
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const breakpointRef = useRef(breakpoint)
  breakpointRef.current = breakpoint
  const canvasWidthRef = useRef(canvasWidth)
  canvasWidthRef.current = canvasWidth
  const scaleRef = useRef(scale)
  scaleRef.current = scale
  const interactiveRef = useRef(interactive)
  interactiveRef.current = interactive

  const sessionRef = useRef<CanvasDragSession | null>(null)
  const lastRectRef = useRef<LayoutRect | null>(null)
  const rafRef = useRef<number | null>(null)
  const pendingDeltaRef = useRef<
    { kind: 'pan'; dx: number; dy: number } | { kind: 'pinch'; scaleX: number; scaleY: number } | null
  >(null)
  const [preview, setPreview] = useState<CanvasDragPreview | null>(null)

  const setScrollEnabled = useCallback(
    (enabled: boolean) => {
      scrollRef?.current?.setNativeProps({ scrollEnabled: enabled })
    },
    [scrollRef],
  )

  const previewFromSession = useCallback((session: CanvasDragSession, rect: LayoutRect): CanvasDragPreview => {
    const nextBottom = rect.top + rect.height
    return {
      key: designerSelectionKey(session.selection),
      rect,
      containerHeight: session.isRootBlock
        ? Math.max(session.startDocument.container.height, nextBottom + ROW_HEIGHT)
        : null,
    }
  }, [])

  const begin = useCallback(
    (handle: ResizeHandle | 'move', grabbed: DesignerSelection) => {
      if (!interactiveRef.current || grabbed.kind === 'container') return
      if (sessionRef.current?.handle === 'pinch') return
      const session = createCanvasDragSession(
        documentRef.current,
        breakpointRef.current,
        canvasWidthRef.current,
        scaleRef.current,
        handle,
        grabbed,
      )
      if (!session) return
      sessionRef.current = session
      lastRectRef.current = session.startRect
      pendingDeltaRef.current = null
      onSelectRef.current(grabbed)
      if (handle !== 'move') {
        setScrollEnabled(false)
        setPreview(previewFromSession(session, session.startRect))
      }
    },
    [previewFromSession, setScrollEnabled],
  )

  const beginPinch = useCallback(
    (grabbed: DesignerSelection, spans: PinchSpans) => {
      if (!interactiveRef.current || grabbed.kind === 'container') return
      const existing = sessionRef.current
      const pending = pendingDeltaRef.current
      if (existing?.handle === 'pinch') return

      let base = existing
      if (existing && pending?.kind === 'pan') {
        const nextRect = dragSessionRect(existing, pending.dx, pending.dy)
        const nextDocument = applyCanvasDragSession(
          existing,
          pending.dx,
          pending.dy,
          breakpointRef.current,
        )
        base = { ...existing, startRect: nextRect, startDocument: nextDocument }
      }
      if (!base) {
        const created = createCanvasDragSession(
          documentRef.current,
          breakpointRef.current,
          canvasWidthRef.current,
          scaleRef.current,
          'move',
          grabbed,
        )
        if (!created) return
        base = created
      }

      const session: CanvasDragSession = { ...base, handle: 'pinch', pinchStart: spans }
      sessionRef.current = session
      lastRectRef.current = session.startRect
      pendingDeltaRef.current = { kind: 'pinch', scaleX: 1, scaleY: 1 }
      onSelectRef.current(grabbed)
      setScrollEnabled(false)
      setPreview(previewFromSession(session, session.startRect))
    },
    [previewFromSession, setScrollEnabled],
  )

  const applyPending = useCallback(() => {
    rafRef.current = null
    const session = sessionRef.current
    const pending = pendingDeltaRef.current
    if (!session || !pending) return
    const nextRect =
      pending.kind === 'pinch'
        ? pinchSessionRect(session, pending.scaleX, pending.scaleY)
        : dragSessionRect(session, pending.dx, pending.dy)
    if (lastRectRef.current && layoutRectsEqual(lastRectRef.current, nextRect)) return
    lastRectRef.current = nextRect
    setScrollEnabled(false)
    setPreview(previewFromSession(session, nextRect))
  }, [previewFromSession, setScrollEnabled])

  const move = useCallback(
    (dx: number, dy: number) => {
      if (!sessionRef.current || sessionRef.current.handle === 'pinch') return
      pendingDeltaRef.current = { kind: 'pan', dx, dy }
      if (rafRef.current != null) return
      rafRef.current = requestAnimationFrame(applyPending)
    },
    [applyPending],
  )

  const pinch = useCallback(
    (spans: PinchSpans) => {
      const session = sessionRef.current
      if (!session?.pinchStart) return
      const scale = pinchScaleFromSpans(session.pinchStart, spans)
      pendingDeltaRef.current = { kind: 'pinch', scaleX: scale.scaleX, scaleY: scale.scaleY }
      if (rafRef.current != null) return
      rafRef.current = requestAnimationFrame(applyPending)
    },
    [applyPending],
  )

  const end = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    const session = sessionRef.current
    const pending = pendingDeltaRef.current
    sessionRef.current = null
    pendingDeltaRef.current = null
    lastRectRef.current = null
    setScrollEnabled(true)
    setPreview(null)
    if (!session || !pending) return
    if (pending.kind === 'pinch') {
      if (Math.abs(pending.scaleX - 1) < 0.02 && Math.abs(pending.scaleY - 1) < 0.02) return
      onDocumentChangeRef.current(
        applyCanvasPinchSession(session, pending.scaleX, pending.scaleY, breakpointRef.current),
      )
      return
    }
    if (Math.abs(pending.dx) < 1 && Math.abs(pending.dy) < 1) return
    onDocumentChangeRef.current(
      applyCanvasDragSession(session, pending.dx, pending.dy, breakpointRef.current),
    )
  }, [setScrollEnabled])

  const actions = useMemo(
    () => ({ begin, beginPinch, move, pinch, end }),
    [begin, beginPinch, end, move, pinch],
  )

  return (
    <DesignerCanvasDragActionsContext.Provider value={actions}>
      <DesignerCanvasPreviewContext.Provider value={preview}>
        {children}
      </DesignerCanvasPreviewContext.Provider>
    </DesignerCanvasDragActionsContext.Provider>
  )
}

export function useDesignerCanvasDrag() {
  return useContext(DesignerCanvasDragActionsContext)
}

export function useCanvasPreviewRect(key: string): LayoutRect | null {
  const preview = useContext(DesignerCanvasPreviewContext)
  if (!preview || preview.key !== key) return null
  return preview.rect
}

export function useCanvasPreviewContainerHeight(): number | null {
  return useContext(DesignerCanvasPreviewContext)?.containerHeight ?? null
}
