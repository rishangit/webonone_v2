import { useThemeColors } from './ThemeProvider'

/** Control / chrome icon stroke — theme secondary; primary when active or has value. */
export function useThemedControlIconColor(options?: { active?: boolean; hasValue?: boolean }): string {
  const colors = useThemeColors()
  if (options?.active || options?.hasValue) {
    return colors.primary
  }
  return colors.secondary
}
