import { View } from 'react-native'
import { themeDtoToColors } from '@webonone/theme'
import { THEME_COLOR_KEYS } from '@/features/settings/system-theme/constants/themeDefaults'
import type { ApiTheme } from '@/features/settings/system-theme/services/themeApi'

export function ThemeColorSwatches({ theme }: { theme: Pick<ApiTheme, 'color1' | 'color2' | 'color3' | 'color4' | 'color5'> }) {
  const colors = themeDtoToColors(theme)

  return (
    <View className="flex-row gap-1">
      {THEME_COLOR_KEYS.map((key) => (
        <View
          key={key}
          className="h-6 w-6 rounded border border-border"
          style={{ backgroundColor: colors[key] }}
        />
      ))}
    </View>
  )
}
