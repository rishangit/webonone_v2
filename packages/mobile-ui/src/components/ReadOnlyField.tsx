import { View } from 'react-native'
import { Muted, Body } from './Typography'

export interface ReadOnlyFieldProps {
  label: string
  value?: string | null
}

export function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  return (
    <View className="gap-1">
      <Muted className="text-xs uppercase tracking-wide">{label}</Muted>
      <Body className="text-sm">{value?.trim() ? value : '—'}</Body>
    </View>
  )
}
