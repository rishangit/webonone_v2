import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { CanvasResizeHandle } from '@/features/design/website/canvas/CanvasDraggable'
import { resizeHandleStyle } from '@/features/design/website/canvas/resizeHandleLayout'
import { RESIZE_HANDLES, type ResizeHandle } from '@/features/design/website/document/layout'
import type { DesignerSelection } from '@/features/design/website/types'

function handleMarkerStyle(handle: ResizeHandle, color: string) {
  const edge = handle.length === 1
  const size = edge ? 3 : 10
  const base = {
    position: 'absolute' as const,
    backgroundColor: color,
    borderRadius: edge ? 1 : 2,
  }
  switch (handle) {
    case 'n':
      return { ...base, top: 0, left: '35%' as const, width: '30%' as const, height: size }
    case 's':
      return { ...base, bottom: 0, left: '35%' as const, width: '30%' as const, height: size }
    case 'e':
      return { ...base, right: 0, top: '35%' as const, height: '30%' as const, width: size }
    case 'w':
      return { ...base, left: 0, top: '35%' as const, height: '30%' as const, width: size }
    case 'ne':
      return { ...base, right: 0, top: 0, width: size, height: size }
    case 'nw':
      return { ...base, left: 0, top: 0, width: size, height: size }
    case 'se':
      return { ...base, right: 0, bottom: 0, width: size, height: size }
    case 'sw':
      return { ...base, left: 0, bottom: 0, width: size, height: size }
    default:
      return base
  }
}

export function SelectionChrome({
  grabbed,
  color,
}: {
  grabbed: DesignerSelection
  color: string
}) {
  const { t } = useTranslation('website')

  return (
    <>
      {RESIZE_HANDLES.map((handle) => (
        <View key={handle} pointerEvents="box-none" style={resizeHandleStyle(handle)}>
          <View pointerEvents="none" style={handleMarkerStyle(handle, color)} />
          <CanvasResizeHandle
            grabbed={grabbed}
            handle={handle}
            accessibilityLabel={t('resizeHandle', { handle })}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
        </View>
      ))}
    </>
  )
}
