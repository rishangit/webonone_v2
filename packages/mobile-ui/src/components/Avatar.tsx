import { useState } from 'react'

import { Image, Text, View, type ViewProps } from 'react-native'

import { cn } from '../lib/cn'

import { avatarSizeClass, avatarTextClass, type AvatarSize } from './avatarVariants'



export type AvatarProps = ViewProps & {

  src?: string | null

  alt?: string

  fallback?: string

  size?: AvatarSize

  className?: string

}



export function Avatar({

  src,

  alt,

  fallback,

  size = 'md',

  className,

  ...props

}: AvatarProps) {

  const [failed, setFailed] = useState(false)

  const initials = fallback?.slice(0, 2).toUpperCase() ?? '?'

  const showImage = Boolean(src) && !failed



  return (

    <View

      accessibilityLabel={alt ?? fallback ?? 'User avatar'}

      className={cn(

        'relative shrink-0 overflow-hidden rounded-full border border-primary',

        avatarSizeClass[size],

        className,

      )}

      {...props}

    >

      {showImage ? (

        <Image

          source={{ uri: src! }}

          accessibilityLabel={alt ?? fallback ?? 'User avatar'}

          className="h-full w-full"

          resizeMode="cover"

          onError={() => setFailed(true)}

        />

      ) : (

        <View className="h-full w-full items-center justify-center bg-primary/10">

          <Text className={cn('font-medium text-primary', avatarTextClass[size])}>{initials}</Text>

        </View>

      )}

    </View>

  )

}



export function getAvatarInitials(displayName: string): string {

  const parts = displayName.trim().split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {

    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()

  }

  return displayName.slice(0, 2).toUpperCase() || '?'

}


