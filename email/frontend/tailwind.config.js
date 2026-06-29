import uiKitPreset from '@webonone/ui-kit/tailwind'

/** @type {import('tailwindcss').Config} */
export default {
  presets: [uiKitPreset],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../ui-kit/package/src/**/*.{ts,tsx}'],
}
