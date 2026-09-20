import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { View } from 'react-native'
import { vars } from 'nativewind'
import {
  createPlatformDefaultThemeDto,
  deriveSemanticColors,
  themeDtoToColors,
  type ColorMode,
  type SemanticColors,
} from '@webonone/theme'
import { semanticColorsToVars } from './themeVars'

export type MobileThemeValue = {
  colors: SemanticColors
  colorMode: ColorMode
}

const defaultTheme: MobileThemeValue = {
  colorMode: 'light',
  colors: deriveSemanticColors(themeDtoToColors(createPlatformDefaultThemeDto()), 'light'),
}

const ThemeContext = createContext<MobileThemeValue>(defaultTheme)

export function useThemeColors(): SemanticColors {
  return useContext(ThemeContext).colors
}

export function useColorMode(): ColorMode {
  return useContext(ThemeContext).colorMode
}

export function useMobileTheme(): MobileThemeValue {
  return useContext(ThemeContext)
}

export function ThemeProvider({
  colors,
  colorMode = 'light',
  children,
}: {
  colors?: SemanticColors
  colorMode?: ColorMode
  children: ReactNode
}) {
  const resolved = colors ?? deriveSemanticColors(themeDtoToColors(createPlatformDefaultThemeDto()), colorMode)
  const value = useMemo(() => ({ colors: resolved, colorMode }), [resolved, colorMode])
  const themeVars = useMemo(() => vars(semanticColorsToVars(resolved, colorMode)), [resolved, colorMode])

  return (
    <ThemeContext.Provider value={value}>
      <View className="flex-1 bg-background" style={themeVars}>
        {children}
      </View>
    </ThemeContext.Provider>
  )
}
