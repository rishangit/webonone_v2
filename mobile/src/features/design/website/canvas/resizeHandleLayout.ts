import type { ViewStyle } from 'react-native'
import type { ResizeHandle } from '@/features/design/website/document/layout'

const EDGE = 16
const CORNER = 20

export function resizeHandleStyle(handle: ResizeHandle): ViewStyle {
  const base: ViewStyle = {
    position: 'absolute',
    zIndex: 30,
  }
  switch (handle) {
    case 'n':
      return { ...base, left: 0, right: 0, top: 0, height: EDGE }
    case 's':
      return { ...base, left: 0, right: 0, bottom: 0, height: EDGE }
    case 'e':
      return { ...base, right: 0, top: 0, bottom: 0, width: EDGE }
    case 'w':
      return { ...base, left: 0, top: 0, bottom: 0, width: EDGE }
    case 'ne':
      return { ...base, right: 0, top: 0, width: CORNER, height: CORNER }
    case 'nw':
      return { ...base, left: 0, top: 0, width: CORNER, height: CORNER }
    case 'se':
      return { ...base, right: 0, bottom: 0, width: CORNER, height: CORNER }
    case 'sw':
      return { ...base, left: 0, bottom: 0, width: CORNER, height: CORNER }
    default:
      return base
  }
}
