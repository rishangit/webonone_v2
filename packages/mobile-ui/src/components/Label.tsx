import { Text, type TextProps } from 'react-native'
import { cn } from '../lib/cn'

export function Label({ className, required, children, ...props }: TextProps & { required?: boolean }) {
  return (
    <Text className={cn('text-sm font-medium leading-none text-foreground', className)} {...props}>
      {children}
      {required ? <Text className="text-destructive"> *</Text> : null}
    </Text>
  )
}
