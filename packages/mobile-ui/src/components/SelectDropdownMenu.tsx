import { useEffect, useState, type ReactNode } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type LayoutRectangle,
} from 'react-native'
import { Check } from 'lucide-react-native'
import { cn } from '../lib/cn'
import { controlDisplayTextProps } from '../lib/controlStyles'
import { useThemeColors } from '../theme/ThemeProvider'
import { Body } from './Typography'

export type SelectDropdownOption = {
  value: string
  label: ReactNode
}

export type SelectDropdownAnchor = {
  x: number
  y: number
  width: number
  height: number
}

const MENU_GAP = 4
const MENU_MAX_HEIGHT = 288

export function SelectDropdownMenu({
  open,
  onClose,
  anchor,
  options,
  value,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  anchor: SelectDropdownAnchor | null
  options: SelectDropdownOption[]
  value?: string
  onSelect: (value: string) => void
}) {
  const colors = useThemeColors()
  const { height: windowHeight } = useWindowDimensions()
  const [menuLayout, setMenuLayout] = useState<LayoutRectangle | null>(null)

  useEffect(() => {
    if (!open) {
      setMenuLayout(null)
    }
  }, [open])

  if (!open || !anchor) {
    return null
  }

  const spaceBelow = windowHeight - (anchor.y + anchor.height + MENU_GAP)
  const openUpward =
    spaceBelow < Math.min(MENU_MAX_HEIGHT, options.length * 48) &&
    anchor.y > spaceBelow
  const menuTop = openUpward
    ? Math.max(8, anchor.y - MENU_GAP - (menuLayout?.height ?? MENU_MAX_HEIGHT))
    : anchor.y + anchor.height + MENU_GAP

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          className="absolute inset-0 bg-black/40"
          onPress={onClose}
        />
        <View
          className="absolute overflow-hidden rounded-md border border-input-border bg-surface shadow-lg"
          style={{
            top: menuTop,
            left: anchor.x,
            width: anchor.width,
            maxHeight: MENU_MAX_HEIGHT,
          }}
          onLayout={(event) => setMenuLayout(event.nativeEvent.layout)}
        >
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
            <View className="gap-0.5 p-1">
              {options.map((option) => {
                const selected = option.value === value
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      onSelect(option.value)
                      onClose()
                    }}
                    className={cn(
                      'min-h-11 flex-row items-center rounded-lg px-2 py-2',
                      selected && 'bg-primary/10',
                    )}
                  >
                    <View className="h-5 w-5 shrink-0 items-center justify-center">
                      {selected ? <Check size={16} color={colors.primary} strokeWidth={2.5} /> : null}
                    </View>
                    <View className="min-w-0 flex-1 justify-center pr-2">
                      {typeof option.label === 'string' ? (
                        <Body
                          className={cn('leading-none', selected && 'font-medium text-primary')}
                          {...controlDisplayTextProps()}
                        >
                          {option.label}
                        </Body>
                      ) : (
                        option.label
                      )}
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
