import type { WebsiteBreakpoint, WebsiteTextStyle } from '../../types'

export const SIZE_LABEL_KEYS: Record<WebsiteBreakpoint, 'sizeSm' | 'sizeMd' | 'sizeLg' | 'sizeXl' | 'size2xl'> = {
  sm: 'sizeSm',
  md: 'sizeMd',
  lg: 'sizeLg',
  xl: 'sizeXl',
  '2xl': 'size2xl',
}

export function defaultSizeByBreakpoint(size = 16): NonNullable<WebsiteTextStyle['sizeByBreakpoint']> {
  return { sm: size, md: size, lg: size, xl: size, '2xl': size }
}
