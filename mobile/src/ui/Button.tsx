import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native'

type ButtonVariant = 'default' | 'outline' | 'destructive' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: React.ReactNode
}

const containerVariant: Record<ButtonVariant, string> = {
  default: 'bg-primary',
  outline: 'bg-transparent border border-border',
  destructive: 'bg-destructive',
  ghost: 'bg-transparent',
}

const labelVariant: Record<ButtonVariant, string> = {
  default: 'text-white',
  outline: 'text-foreground',
  destructive: 'text-white',
  ghost: 'text-primary',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 rounded-md',
  md: 'px-4 py-3 rounded-lg',
  lg: 'px-5 py-4 rounded-xl',
}

export function Button({
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`flex-row items-center justify-center ${containerVariant[variant]} ${sizeClass[size]} ${
        isDisabled ? 'opacity-50' : ''
      }`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' ? '#1E293B' : '#FFFFFF'} />
      ) : (
        <Text className={`text-base font-semibold ${labelVariant[variant]}`}>{children}</Text>
      )}
    </Pressable>
  )
}
