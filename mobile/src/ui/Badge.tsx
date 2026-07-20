import { Text, View } from 'react-native'

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger'

const toneClass: Record<BadgeTone, string> = {
  neutral: 'bg-border',
  success: 'bg-green-100',
  warning: 'bg-amber-100',
  danger: 'bg-red-100',
}

const toneText: Record<BadgeTone, string> = {
  neutral: 'text-foreground',
  success: 'text-green-800',
  warning: 'text-amber-800',
  danger: 'text-red-800',
}

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${toneClass[tone]}`}>
      <Text className={`text-xs font-medium ${toneText[tone]}`}>{children}</Text>
    </View>
  )
}
