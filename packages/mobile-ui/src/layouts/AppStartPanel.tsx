import type { ReactNode } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { cn } from '../lib/cn'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'
import { Subheading } from '../components/Typography'
import {
  SHELL_HEADER_SPACER_CLASS,
  SHELL_OVERLAY_LAYER_STYLE,
  SHELL_SIDE_PANEL_WIDTH_CLASS,
} from './shellPanelLayout'

export interface AppStartPanelProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  closeLabel?: string
  className?: string
  /**
   * Mount in `MobileAppShell` `shellOverlay` (same layer/z-index as the left nav drawer).
   * Overlay sits below the floating shell header.
   */
  shell?: boolean
  /**
   * When true, renders as an absolute overlay within the parent (no Modal).
   * Parent should be `relative` with bounded height. Omits the shell header spacer.
   */
  embedded?: boolean
  /** ScrollView contentContainerClassName override */
  contentContainerClassName?: string
}

function AppStartPanelSurface({
  title,
  children,
  footer,
  closeLabel,
  onClose,
  className,
  contentContainerClassName,
}: {
  title: string
  children: ReactNode
  footer?: ReactNode
  closeLabel: string
  onClose: () => void
  className?: string
  contentContainerClassName?: string
}) {
  const iconColor = useThemedControlIconColor()

  return (
    <View
      className={cn(
        SHELL_SIDE_PANEL_WIDTH_CLASS,
        'shrink-0 overflow-hidden rounded-shell border border-shell-border bg-shell',
        className,
      )}
    >
      <View className="min-h-0 flex-1">
        <View className="flex-row items-center justify-between border-b border-shell-border px-4 py-3">
          <Subheading className="flex-1">{title}</Subheading>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-md"
          >
            <X size={18} color={iconColor} strokeWidth={2} />
          </Pressable>
        </View>
        <ScrollView
          className="flex-1"
          contentContainerClassName={contentContainerClassName ?? 'gap-4 p-4'}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        {footer ? <View className="border-t border-shell-border">{footer}</View> : null}
      </View>
    </View>
  )
}

function AppStartPanelOverlay({
  onClose,
  closeLabel,
  includeHeaderSpacer,
  children,
}: {
  onClose: () => void
  closeLabel: string
  includeHeaderSpacer: boolean
  children: ReactNode
}) {
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
          {includeHeaderSpacer ? (
            <View className={SHELL_HEADER_SPACER_CLASS} style={{ pointerEvents: 'none' }} />
          ) : null}
          <View className="min-h-0 flex-1 flex-row" style={{ pointerEvents: 'box-none' }}>
            {children}
            <Pressable
              className="flex-1"
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}

/**
 * Left slide-over panel — same geometry and overlay as the shell `AppDrawer` rail.
 */
export function AppStartPanel({
  open,
  onClose,
  title,
  children,
  footer,
  closeLabel = 'Close',
  className,
  shell = false,
  embedded = false,
  contentContainerClassName,
}: AppStartPanelProps) {
  if (!open) return null

  const surface = (
    <AppStartPanelSurface
      title={title}
      closeLabel={closeLabel}
      onClose={onClose}
      footer={footer}
      className={className}
      contentContainerClassName={contentContainerClassName}
    >
      {children}
    </AppStartPanelSurface>
  )

  if (shell || embedded) {
    return (
      <AppStartPanelOverlay
        onClose={onClose}
        closeLabel={closeLabel}
        includeHeaderSpacer={shell}
      >
        {surface}
      </AppStartPanelOverlay>
    )
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1">
        <AppStartPanelOverlay onClose={onClose} closeLabel={closeLabel} includeHeaderSpacer={true}>
          {surface}
        </AppStartPanelOverlay>
      </View>
    </Modal>
  )
}
