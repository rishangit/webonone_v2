import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { cn } from '../lib/cn'
import {
  SHELL_HEADER_SPACER_CLASS,
  SHELL_OVERLAY_LAYER_STYLE,
} from './shellPanelLayout'

export interface AppShellDropdownPanelProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  closeLabel?: string
  accessibilityLabel?: string
  className?: string
}

/**
 * Full-width shell dropdown below the header — mirrors web mobile notification panel
 * (`app-shell-slide-panel--full-width` + `max-h-80` in `#shell-slide-host`).
 */
export function AppShellDropdownPanel({
  open,
  onClose,
  children,
  closeLabel = 'Close',
  accessibilityLabel,
  className,
}: AppShellDropdownPanelProps) {
  if (!open) return null

  return (
    <View className="absolute inset-0" style={SHELL_OVERLAY_LAYER_STYLE}>
      <Pressable
        className="absolute inset-0 bg-black/50"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
      />
      <SafeAreaView className="absolute inset-0" edges={['top', 'bottom']} style={{ pointerEvents: 'box-none' }}>
        <View className="min-h-0 flex-1 gap-2 p-2" style={{ pointerEvents: 'box-none' }}>
          <View className={SHELL_HEADER_SPACER_CLASS} style={{ pointerEvents: 'none' }} />
          <View
            accessibilityRole="none"
            accessibilityLabel={accessibilityLabel}
            className={cn(
              'max-h-80 w-full min-w-0 overflow-hidden rounded-lg border border-shell-border bg-shell shadow-md',
              className,
            )}
            style={{ pointerEvents: 'auto' }}
          >
            {children}
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}
