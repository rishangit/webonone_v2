import { View } from 'react-native'

export function SelectionFrame({
  color,
  dashed = false,
}: {
  color: string
  dashed?: boolean
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 20,
        borderWidth: 2,
        borderColor: color,
        borderStyle: dashed ? 'dashed' : 'solid',
      }}
    />
  )
}

export function CanvasColumnGrid() {
  return (
    <View pointerEvents="none" className="absolute inset-0 flex-row">
      {Array.from({ length: 12 }, (_, index) => (
        <View
          key={index}
          className="flex-1"
          style={{
            borderRightWidth: index === 11 ? 0 : 1,
            borderStyle: 'dashed',
            borderColor: 'rgba(0,0,0,0.1)',
          }}
        />
      ))}
    </View>
  )
}

/** Horizontal row bands — matches web `RowGridOverlay` (32px logical rows, scaled on canvas). */
export function CanvasRowGrid({
  heightPx,
  rowHeightPx,
  borderColor = 'rgba(0,0,0,0.1)',
}: {
  heightPx: number
  rowHeightPx: number
  borderColor?: string
}) {
  const rowCount = Math.max(1, Math.ceil(heightPx / rowHeightPx))
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: heightPx }}>
      {Array.from({ length: rowCount }, (_, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: index * rowHeightPx,
            height: rowHeightPx,
            borderBottomWidth: 1,
            borderStyle: 'dashed',
            borderColor,
          }}
        />
      ))}
    </View>
  )
}
