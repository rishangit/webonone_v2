import type { ReactNode } from 'react'
import { View } from 'react-native'
import { ArrowLeft } from 'lucide-react-native'
import { cn } from '../lib/cn'
import { Button } from '../components/Button'
import { Heading, Muted } from '../components/Typography'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  onBack?: () => void
  backLabel?: string
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  onBack,
  backLabel = 'Back',
  className,
}: PageHeaderProps) {
  const iconColor = useThemedControlIconColor()

  const backButton = onBack ? (
    <Button
      variant="ghost"
      size="icon"
      accessibilityLabel={backLabel}
      onPress={onBack}
      className="mt-0.5 h-9 w-9"
    >
      <ArrowLeft size={20} color={iconColor} strokeWidth={2} />
    </Button>
  ) : null

  /** Full-width row below description — same as web `PageHeader` when `description` is set. */
  const actionsBelow = actions ? <View className="w-full">{actions}</View> : null
  const actionsInline = actions ? (
    <View className="shrink-0 flex-row flex-wrap items-center justify-end gap-2">{actions}</View>
  ) : null

  if (description) {
    return (
      <View
        className={cn('gap-2', className)}
        onTouchStart={actions ? (event) => event.stopPropagation() : undefined}
      >
        <View className="flex-row items-start gap-2">
          {backButton}
          <View className="min-w-0 flex-1 gap-1">
            <Heading className="text-2xl font-semibold">{title}</Heading>
            <Muted>{description}</Muted>
          </View>
        </View>
        {actionsBelow}
      </View>
    )
  }

  return (
    <View
      className={cn('gap-2', className)}
      onTouchStart={actions ? (event) => event.stopPropagation() : undefined}
    >
      <View className="flex-row items-start gap-2">
        {backButton}
        <View className="min-w-0 flex-1 flex-row items-center justify-between gap-2">
          <Heading className="min-w-0 flex-1 text-2xl font-semibold">{title}</Heading>
          {actionsInline}
        </View>
      </View>
    </View>
  )
}
