import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { Label } from './Label'

export function FormField({
  label,
  required,
  error,
  hint,
  children,
}: {
  label?: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <View className="gap-2">
      {label ? <Label required={required}>{label}</Label> : null}
      {children}
      {error ? <Text className="text-sm text-destructive">{error}</Text> : hint ? (
        <Text className="text-xs text-muted">{hint}</Text>
      ) : null}
    </View>
  )
}
