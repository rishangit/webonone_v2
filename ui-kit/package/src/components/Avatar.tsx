import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'
import { avatarVariants } from './avatar-variants'

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  src?: string | null
  alt?: string
  fallback?: string
}

function Avatar({ className, size, src, alt, fallback, ...props }: AvatarProps) {
  const initials = fallback?.slice(0, 2).toUpperCase() ?? '?'

  return (
    <AvatarPrimitive.Root className={cn(avatarVariants({ size }), className)} {...props}>
      {src ? (
        <AvatarPrimitive.Image src={src} alt={alt ?? fallback ?? 'User avatar'} className="aspect-square h-full w-full" />
      ) : null}
      <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-muted font-medium text-muted-foreground">
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}

export { Avatar, avatarVariants }
