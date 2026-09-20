import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native'
import { cn } from '../lib/cn'
import { controlLabelClassName } from '../lib/controlStyles'
import { useThemeColors } from '../theme/ThemeProvider'
import { PrimaryGradientFill } from './PrimaryGradientFill'

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost'

type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

const containerVariant: Record<ButtonVariant, string> = {
  default: 'bg-primary',
  secondary: 'bg-secondary',
  outline: 'border border-secondary bg-transparent',
  destructive: 'bg-destructive',
  ghost: 'bg-transparent',
}

const labelVariant: Record<ButtonVariant, string> = {
  default: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  outline: 'text-secondary',
  destructive: 'text-primary-foreground',
  ghost: 'text-primary',
}

/** Matches web `button-variants` sizes, including `has-[svg]` extra padding. */
const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-11 min-w-11 px-4 rounded-control',
  md: 'h-12 px-5 rounded-control',
  lg: 'h-14 px-8 rounded-control',
  icon: 'h-12 w-12 rounded-control p-0',
}

const sizeWithIconClass: Record<ButtonSize, string> = {
  sm: 'h-11 min-w-11 px-6 rounded-control',
  md: 'h-12 px-7 rounded-control',
  lg: 'h-14 px-10 rounded-control',
  icon: 'h-12 w-12 rounded-control p-0',
}

export function Button({
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const colors = useThemeColors()
  const isDisabled = disabled || loading
  const isPrimaryGradient = variant === 'default'
  const hasIconChildren =
    !loading && typeof children !== 'string' && typeof children !== 'number'
  const spinnerColor =
    variant === 'outline' ? colors.secondary : variant === 'ghost' ? colors.text : colors.primaryText

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        'relative flex-row items-center justify-center gap-2 overflow-hidden',
        containerVariant[variant],
        hasIconChildren ? sizeWithIconClass[size] : sizeClass[size],
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {isPrimaryGradient ? (
        <PrimaryGradientFill fromColor={colors.secondary} toColor={colors.primary} />
      ) : null}
      {loading ? (
        <View className="relative z-10">
          <ActivityIndicator size="small" color={spinnerColor} />
        </View>
      ) : typeof children === 'string' || typeof children === 'number' ? (
        <Text className={cn('relative z-10', controlLabelClassName, labelVariant[variant])}>
          {children}
        </Text>
      ) : (
        <View className="relative z-10 flex-row items-center justify-center gap-2">{children}</View>
      )}
    </Pressable>
  )
}
