import { X } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Modal, Pressable, ScrollView, View, useWindowDimensions, type ViewProps } from 'react-native'
import { cn } from '../lib/cn'
import { resolveDialogPanelWidth, type DialogSizePreset } from '../lib/shellDialogLayout'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'
import { Heading, Muted } from './Typography'

export type { DialogSizePreset }

const PANEL_HEIGHT_FRACTION: Record<Exclude<DialogSizePreset, 'auto'>, number> = {
  small: 0.4,
  medium: 0.55,
  large: 0.75,
  xlarge: 0.9,
}

function resolveHeightPreset(
  sizeWidth: DialogSizePreset,
  sizeHeight?: DialogSizePreset,
): DialogSizePreset {
  if (sizeHeight) return sizeHeight
  if (sizeWidth === 'auto') return 'auto'
  return sizeWidth
}

export interface CustomDialogProps extends Pick<ViewProps, 'testID'> {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  customHeader?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  sizeWidth?: DialogSizePreset
  sizeHeight?: DialogSizePreset
  hideHeader?: boolean
  hideCloseButton?: boolean
  noContentPadding?: boolean
  disableContentScroll?: boolean
  /** When true, blocks overlay / Android back dismiss (use while a nested dialog is open). */
  nestedDismissGuard?: boolean
  /** Stacking order for sibling dialogs (each level adds 10 to overlay z-index). */
  stackLevel?: number
  id?: string
  className?: string
}

function dialogStackZIndex(stackLevel: number): number {
  return 50 + stackLevel * 10
}

export function CustomDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  customHeader,
  footer,
  children,
  sizeWidth = 'medium',
  sizeHeight,
  hideHeader = false,
  hideCloseButton = false,
  noContentPadding = false,
  disableContentScroll = false,
  nestedDismissGuard = false,
  stackLevel = 0,
  id,
  className,
  testID,
}: CustomDialogProps) {
  const iconColor = useThemedControlIconColor()
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const resolvedHeight = resolveHeightPreset(sizeWidth, sizeHeight)
  const isAutoHeight = resolvedHeight === 'auto'
  const panelMaxHeight = Math.round(windowHeight * 0.9)
  const panelHeight = isAutoHeight
    ? undefined
    : Math.round(windowHeight * PANEL_HEIGHT_FRACTION[resolvedHeight])
  const panelWidth = resolveDialogPanelWidth(windowWidth, sizeWidth)

  const bodyPadding = hideHeader && noContentPadding ? '' : noContentPadding ? '' : 'p-4'

  function requestClose() {
    if (nestedDismissGuard) return
    onOpenChange(false)
  }

  const body = <View className={cn('gap-3', bodyPadding)}>{children}</View>

  const shellStyle = {
    width: panelWidth,
    alignSelf: 'center' as const,
  }

  const panelStyle = {
    width: panelWidth,
    maxHeight: panelMaxHeight,
    ...(panelHeight !== undefined ? { height: panelHeight, minHeight: panelHeight } : undefined),
  }

  const autoScrollMaxHeight = Math.round(windowHeight * 0.55)
  const bodyStyle = isAutoHeight
    ? { maxHeight: autoScrollMaxHeight }
    : { flex: 1, minHeight: 0 }

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={requestClose}
      testID={testID}
    >
      <Pressable
        className="flex-1 justify-center bg-black/50 px-2 py-2"
        style={{ zIndex: dialogStackZIndex(stackLevel) }}
        onPress={requestClose}
      >
        <Pressable style={shellStyle} onPress={(event) => event.stopPropagation()}>
          <View
            style={panelStyle}
            className={cn(
              'flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg',
              className,
            )}
          >
            {!hideHeader ? (
              <View
                nativeID={id ? `${id}-header` : undefined}
                className="relative shrink-0 border-b border-border px-4 pb-3 pt-4"
              >
                {customHeader ?? (
                  <View className="flex-row items-start gap-3 pr-8">
                    {icon ? <View className="mt-0.5 shrink-0">{icon}</View> : null}
                    <View className="min-w-0 flex-1 gap-1">
                      {title ? <Heading className="text-lg">{title}</Heading> : null}
                      {description ? <Muted>{description}</Muted> : null}
                    </View>
                  </View>
                )}
                {!hideCloseButton ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    className="absolute right-3 top-3 h-8 w-8 items-center justify-center rounded-full"
                    onPress={requestClose}
                  >
                    <X size={18} color={iconColor} strokeWidth={2} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {disableContentScroll ? (
              <View nativeID={id ? `${id}-body` : undefined} style={bodyStyle}>
                {body}
              </View>
            ) : (
              <ScrollView
                nativeID={id ? `${id}-body` : undefined}
                style={bodyStyle}
                contentContainerStyle={isAutoHeight ? undefined : { flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                showsVerticalScrollIndicator
              >
                {body}
              </ScrollView>
            )}

            {footer ? (
              <View
                nativeID={id ? `${id}-footer` : undefined}
                className="shrink-0 flex-row flex-wrap justify-end gap-2 border-t border-border px-4 py-3"
              >
                {footer}
              </View>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
