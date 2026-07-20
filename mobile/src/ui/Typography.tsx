import { Text, type TextProps } from 'react-native'

type TextClassProps = TextProps & { className?: string }

export function Heading({ className, ...props }: TextClassProps) {
  return <Text className={`text-2xl font-bold text-foreground ${className ?? ''}`} {...props} />
}

export function Subheading({ className, ...props }: TextClassProps) {
  return <Text className={`text-lg font-semibold text-foreground ${className ?? ''}`} {...props} />
}

export function Body({ className, ...props }: TextClassProps) {
  return <Text className={`text-base text-foreground ${className ?? ''}`} {...props} />
}

export function Muted({ className, ...props }: TextClassProps) {
  return <Text className={`text-sm text-muted ${className ?? ''}`} {...props} />
}
