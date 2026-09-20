import { Text, TextInput, View } from 'react-native'
import { cn } from '../lib/cn'
import { FormField } from './FormField'

export interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  label?: string
  error?: string
  required?: boolean
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  label,
  error,
  required,
}: OtpInputProps) {
  const digits = value.replace(/\D/g, '').slice(0, length)

  return (
    <FormField label={label} required={required} error={error}>
      <View className="relative self-start">
        <View className="flex-row gap-2" pointerEvents="none">
          {Array.from({ length }, (_, index) => (
            <View
              key={index}
              className={cn(
                'h-12 w-12 items-center justify-center rounded-control border bg-transparent',
                error ? 'border-destructive' : 'border-input-border',
              )}
            >
              <Text className="text-lg text-foreground">{digits[index] ?? ''}</Text>
            </View>
          ))}
        </View>
        <TextInput
          value={digits}
          onChangeText={(next) => onChange(next.replace(/\D/g, '').slice(0, length))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          editable={!disabled}
          caretHidden
          className="absolute inset-0 opacity-0"
        />
      </View>
    </FormField>
  )
}
