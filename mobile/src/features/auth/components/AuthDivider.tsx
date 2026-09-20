import { View } from 'react-native'
import { Muted } from '@webonone/mobile-ui'

export function AuthDivider({ label }: { label: string }) {
  return (
    <View className="relative py-1">
      <View className="absolute inset-x-0 top-1/2 h-px bg-border" />
      <View className="items-center">
        <Muted className="bg-card px-2 text-xs uppercase">{label}</Muted>
      </View>
    </View>
  )
}
