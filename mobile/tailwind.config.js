const { createPlatformDefaultThemeDto, themeDtoToColors } = require('@webonone/theme')

const defaultColors = themeDtoToColors(createPlatformDefaultThemeDto())

/**
 * NativeWind (Tailwind) config for the mobile app. Palette slots mirror the
 * platform theme tokens shared with the web microservices via @webonone/theme.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: defaultColors.primary,
        secondary: defaultColors.secondary,
        background: defaultColors.background,
        surface: defaultColors.surface,
        text: defaultColors.text,
        destructive: '#DC2626',
        muted: '#64748B',
        border: '#E2E8F0',
      },
    },
  },
  plugins: [],
}
