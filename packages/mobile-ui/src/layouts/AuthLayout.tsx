import type { ReactNode } from 'react'
import { View } from 'react-native'
import { cn } from '../lib/cn'
import { Card } from '../components/Card'
import { Muted, Subheading } from '../components/Typography'

type AuthLayoutProps = {
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function AuthLayout({ title, description, children, footer, className }: AuthLayoutProps) {
  return (
    <View className={cn('w-full', className)}>
      <Card compact className="w-full rounded-lg">
        {title || description ? (
          <View className="gap-1 border-b border-border px-4 pb-4 pt-4">
            {title ? <Subheading className="text-xl">{title}</Subheading> : null}
            {description ? <Muted>{description}</Muted> : null}
          </View>
        ) : null}
        <View className={cn('px-4 py-4', title || description ? undefined : 'pt-4')}>{children}</View>
        {footer ? <View className="items-center px-4 pb-4 pt-0">{footer}</View> : null}
      </Card>
    </View>
  )
}
