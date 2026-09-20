import type { ReactNode } from 'react'

import { Modal, Pressable, ScrollView, View } from 'react-native'

import { SafeAreaView } from 'react-native-safe-area-context'

import { X } from 'lucide-react-native'

import { cn } from '../lib/cn'

import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'

import { Subheading } from '../components/Typography'

import {

  SHELL_END_PANEL_WIDTH_CLASS,

  SHELL_HEADER_SPACER_CLASS,

  SHELL_OVERLAY_LAYER_STYLE,

} from './shellPanelLayout'



export interface AppEndPanelProps {

  open: boolean

  onClose: () => void

  title: string

  children: ReactNode

  footer?: ReactNode

  closeLabel?: string

  className?: string

  /** Span the full shell width below the header (e.g. AI assistant chat). */

  mobileFullWidth?: boolean

}



function AppEndPanelSurface({

  title,

  children,

  footer,

  closeLabel,

  onClose,

  className,

  fullWidth,

}: {

  title: string

  children: ReactNode

  footer?: ReactNode

  closeLabel: string

  onClose: () => void

  className?: string

  fullWidth?: boolean

}) {

  const iconColor = useThemedControlIconColor()



  return (

    <View

      className={cn(

        fullWidth ? 'flex-1' : SHELL_END_PANEL_WIDTH_CLASS,

        'overflow-hidden rounded-shell border border-shell-border bg-shell',

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

          contentContainerClassName="gap-4 p-4"

          keyboardShouldPersistTaps="handled"

        >

          {children}

        </ScrollView>

        {footer ? <View className="border-t border-shell-border">{footer}</View> : null}

      </View>

    </View>

  )

}



function AppEndPanelShellOverlay({

  open,

  onClose,

  closeLabel,

  fullWidth,

  children,

}: {

  open: boolean

  onClose: () => void

  closeLabel: string

  fullWidth: boolean

  children: ReactNode

}) {

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

          {fullWidth ? (

            <View className="min-h-0 flex-1" style={{ pointerEvents: 'box-none' }}>

              {children}

            </View>

          ) : (

            <View className="min-h-0 flex-1 flex-row" style={{ pointerEvents: 'box-none' }}>

              <Pressable

                className="flex-1"

                onPress={onClose}

                accessibilityRole="button"

                accessibilityLabel={closeLabel}

              />

              {children}

            </View>

          )}

        </View>

      </SafeAreaView>

    </View>

  )

}



/**

 * Right slide-over panel — mirrors web `AppEndPanel` / left nav drawer geometry in `MobileAppShell`.

 *

 * - Default: modal side rail (`w-80`) for filters.

 * - `mobileFullWidth`: shell overlay below the header — mount via `MobileAppShell` `shellOverlay`.

 */

export function AppEndPanel({

  open,

  onClose,

  title,

  children,

  footer,

  closeLabel = 'Close',

  className,

  mobileFullWidth = false,

}: AppEndPanelProps) {

  const surface = (

    <AppEndPanelSurface

      title={title}

      closeLabel={closeLabel}

      onClose={onClose}

      footer={footer}

      className={className}

      fullWidth={mobileFullWidth}

    >

      {children}

    </AppEndPanelSurface>

  )



  if (mobileFullWidth) {

    return (

      <AppEndPanelShellOverlay open={open} onClose={onClose} closeLabel={closeLabel} fullWidth>

        {surface}

      </AppEndPanelShellOverlay>

    )

  }



  return (

    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>

      <SafeAreaView className="flex-1 bg-transparent" edges={['top', 'bottom']}>

        <View className="flex-1 gap-2 p-2">

          <View className={SHELL_HEADER_SPACER_CLASS} />

          <View className="min-h-0 flex-1 flex-row">

            <Pressable

              className="flex-1 bg-black/50"

              onPress={onClose}

              accessibilityRole="button"

              accessibilityLabel={closeLabel}

            />

            {surface}

          </View>

        </View>

      </SafeAreaView>

    </Modal>

  )

}


