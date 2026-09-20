import type { ReactNode } from 'react'
import { View } from 'react-native'
import { cn } from '../lib/cn'
import { Body, Subheading } from './Typography'

export function Alert({
  variant = 'default',
  className,
  children,
}: {
  variant?: 'default' | 'destructive'
  className?: string
  children: ReactNode
}) {
  return (
    <View
      className={cn(
        'gap-1 rounded-lg border p-4',
        variant === 'destructive' ? 'border-destructive bg-destructive/10' : 'border-border bg-surface',
        className,
      )}
    >
      {children}
    </View>
  )
}

export function AlertTitle({ children }: { children: ReactNode }) {
  return <Subheading className="text-base">{children}</Subheading>
}

export function AlertDescription({ children }: { children: ReactNode }) {
  return <Body className="text-sm text-muted">{children}</Body>
}
