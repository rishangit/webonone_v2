import { ActivityIndicator, Text, View } from 'react-native'
import { useThemeColors } from '../theme/ThemeProvider'

export function Spinner({
  label,
  size = 'large',
}: {
  label?: string
  size?: 'small' | 'large'
}) {
  const colors = useThemeColors()
  return (
    <View className="items-center justify-center gap-2 py-8">
      <ActivityIndicator size={size} color={colors.primary} />
      {label ? <Text className="text-sm text-muted">{label}</Text> : null}
    </View>
  )
}
