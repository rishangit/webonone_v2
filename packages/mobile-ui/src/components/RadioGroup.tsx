import { createContext, useContext, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { cn } from '../lib/cn'
import { Body } from './Typography'

type RadioContextValue = {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

const RadioContext = createContext<RadioContextValue | null>(null)

export function RadioGroup({
  value,
  onValueChange,
  disabled,
  children,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <RadioContext.Provider value={{ value, onValueChange, disabled }}>
      <View className={cn('gap-2', className)}>{children}</View>
    </RadioContext.Provider>
  )
}

export function RadioGroupItem({
  value,
  label,
  disabled,
}: {
  value: string
  label: string
  disabled?: boolean
}) {
  const context = useContext(RadioContext)
  if (!context) {
    throw new Error('RadioGroupItem must be used within RadioGroup')
  }
  const selected = context.value === value
  const isDisabled = disabled || context.disabled

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: !!isDisabled }}
      disabled={isDisabled}
      onPress={() => context.onValueChange(value)}
      className={cn('flex-row items-center gap-2', isDisabled && 'opacity-50')}
    >
      <View
        className={cn(
          'h-5 w-5 items-center justify-center rounded-full border',
          selected ? 'border-primary' : 'border-input-border',
        )}
      >
        {selected ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
      </View>
      <Body className="flex-1 text-base">{label}</Body>
    </Pressable>
  )
}
