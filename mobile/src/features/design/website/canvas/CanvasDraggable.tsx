import { useMemo, useRef, type ReactNode } from 'react'
import {
  PanResponder,
  Pressable,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { useDesignerCanvasDrag } from '@/features/design/website/canvas/DesignerCanvasDragContext'
import { pinchSpansFromPoints, type PinchSpans, type ResizeHandle } from '@/features/design/website/document/layout'
import type { DesignerSelection } from '@/features/design/website/types'

function readPinchSpans(event: GestureResponderEvent): PinchSpans | null {
  const touches = event.nativeEvent.touches
  if (touches.length < 2) return null
  return pinchSpansFromPoints(
    { x: touches[0].pageX, y: touches[0].pageY },
    { x: touches[1].pageX, y: touches[1].pageY },
  )
}

export function CanvasDraggable({
  grabbed,
  captureMove,
  stealFromChildren = false,
  onTap,
  style,
  children,
}: {
  grabbed: DesignerSelection
  captureMove: boolean
  /** Selected host — take follow-up drags so nested addons don't steal the move. */
  stealFromChildren?: boolean
  onTap: () => void
  style?: StyleProp<ViewStyle>
  children: ReactNode
}) {
  const drag = useDesignerCanvasDrag()
  const grabbedRef = useRef(grabbed)
  grabbedRef.current = grabbed
  const captureRef = useRef(captureMove)
  captureRef.current = captureMove
  const stealRef = useRef(stealFromChildren)
  stealRef.current = stealFromChildren

  const pan = useMemo(() => {
    if (!drag) return null
    return PanResponder.create({
      onStartShouldSetPanResponder: (_, gesture) =>
        captureRef.current || gesture.numberActiveTouches >= 2,
      onStartShouldSetPanResponderCapture: (_, gesture) =>
        stealRef.current && gesture.numberActiveTouches >= 2,
      onMoveShouldSetPanResponder: (_, gesture) =>
        captureRef.current || gesture.numberActiveTouches >= 2,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        stealRef.current &&
        (gesture.numberActiveTouches >= 2 || Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4),
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (event, gesture) => {
        const pinch = readPinchSpans(event)
        if (pinch && (captureRef.current || stealRef.current || gesture.numberActiveTouches >= 2)) {
          drag.beginPinch(grabbedRef.current, pinch)
          return
        }
        if (captureRef.current) drag.begin('move', grabbedRef.current)
      },
      onPanResponderStart: (event) => {
        const pinch = readPinchSpans(event)
        if (pinch) drag.beginPinch(grabbedRef.current, pinch)
      },
      onPanResponderMove: (event, gesture) => {
        const pinch = readPinchSpans(event)
        if (pinch) {
          drag.pinch(pinch)
          return
        }
        drag.move(gesture.dx, gesture.dy)
      },
      onPanResponderRelease: () => {
        drag.end()
      },
      onPanResponderTerminate: () => {
        drag.end()
      },
    })
  }, [drag])

  if (!drag) {
    return (
      <Pressable onPress={onTap} style={style}>
        {children}
      </Pressable>
    )
  }

  if (!captureMove) {
    return (
      <Pressable onPress={onTap} style={style}>
        {children}
      </Pressable>
    )
  }

  return (
    <View collapsable={false} style={style} {...pan?.panHandlers}>
      {children}
    </View>
  )
}

export function CanvasResizeHandle({
  grabbed,
  handle,
  style,
  accessibilityLabel,
}: {
  grabbed: DesignerSelection
  handle: ResizeHandle
  style: ViewStyle
  accessibilityLabel: string
}) {
  const drag = useDesignerCanvasDrag()
  const grabbedRef = useRef(grabbed)
  grabbedRef.current = grabbed
  const handleRef = useRef(handle)
  handleRef.current = handle

  const pan = useMemo(() => {
    if (!drag) return null
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        drag.begin(handleRef.current, grabbedRef.current)
      },
      onPanResponderMove: (_, gesture) => {
        drag.move(gesture.dx, gesture.dy)
      },
      onPanResponderRelease: () => {
        drag.end()
      },
      onPanResponderTerminate: () => {
        drag.end()
      },
    })
  }, [drag])

  if (!drag || !pan) return null

  return (
    <View
      collapsable={false}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={style}
      {...pan.panHandlers}
    />
  )
}
