import { Text, type TextProps } from 'react-native'
import { cn } from '../lib/cn'

type TextClassProps = TextProps

export function Heading({ className, ...props }: TextClassProps) {
  return <Text className={cn('text-2xl font-bold text-title', className)} {...props} />
}

export function Subheading({ className, ...props }: TextClassProps) {
  return <Text className={cn('text-lg font-semibold text-foreground', className)} {...props} />
}

export function Body({ className, ...props }: TextClassProps) {
  return <Text className={cn('text-base text-foreground', className)} {...props} />
}

export function Muted({ className, ...props }: TextClassProps) {
  return <Text className={cn('text-sm text-muted', className)} {...props} />
}
