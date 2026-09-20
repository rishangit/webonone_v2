import type { ReactNode } from 'react'

import { Modal, Pressable, View } from 'react-native'

import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { cn } from '../lib/cn'

import { Body, Muted } from './Typography'



export function HeaderMenu({

  open,

  onClose,

  align = 'end',

  topOffset = 64,

  className,

  children,

}: {

  open: boolean

  onClose: () => void

  align?: 'start' | 'end'

  topOffset?: number

  className?: string

  children: ReactNode

}) {

  const insets = useSafeAreaInsets()

  const top = insets.top + topOffset



  return (

    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>

      <View className="flex-1">

        <Pressable className="absolute inset-0" onPress={onClose} accessibilityLabel="Close menu" />

        <View

          className={cn(

            'absolute w-56 overflow-hidden rounded-md border border-border bg-surface shadow-lg',

            align === 'end' ? 'right-2' : 'left-2',

            className,

          )}

          style={{ top }}

        >

          {children}

        </View>

      </View>

    </Modal>

  )

}



export function HeaderMenuSeparator() {

  return <View className="h-px bg-border" />

}



export function HeaderMenuItem({

  label,

  onPress,

  icon,

  selected,

}: {

  label: string

  onPress: () => void

  icon?: ReactNode

  selected?: boolean

}) {

  return (

    <Pressable

      accessibilityRole="button"

      onPress={onPress}

      className={cn('flex-row items-center gap-2 px-3 py-2.5', selected && 'bg-primary/10')}

    >

      {icon}

      <Body className={cn('text-sm', selected && 'font-semibold text-primary')}>{label}</Body>

    </Pressable>

  )

}



export function HeaderMenuProfileBlock({

  title,

  subtitle,

  footer,

  onPress,

}: {

  title: string

  subtitle?: string | null

  footer?: ReactNode

  onPress?: () => void

}) {

  const content = (

    <View className="gap-1 px-3 py-2.5">

      <Body className="text-sm font-medium">{title}</Body>

      {subtitle ? <Muted className="text-xs">{subtitle}</Muted> : null}

      {footer}

    </View>

  )



  if (onPress) {

    return (

      <Pressable accessibilityRole="button" onPress={onPress}>

        {content}

      </Pressable>

    )

  }



  return content

}


