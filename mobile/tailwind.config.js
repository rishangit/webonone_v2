const { PLATFORM_DEFAULT_THEME } = require('@webonone/theme')

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
        primary: PLATFORM_DEFAULT_THEME.color1,
        secondary: PLATFORM_DEFAULT_THEME.color2,
        accent: PLATFORM_DEFAULT_THEME.color3,
        background: PLATFORM_DEFAULT_THEME.color4,
        foreground: PLATFORM_DEFAULT_THEME.color5,
        destructive: '#DC2626',
        muted: '#64748B',
        border: '#E2E8F0',
      },
    },
  },
  plugins: [],
}
