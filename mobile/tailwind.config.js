/**
 * NativeWind (Tailwind) config for the mobile app. Palette slots are CSS variables
 * so ThemeProvider can apply the selected system theme and light/dark appearance.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../packages/mobile-ui/src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        card: 'var(--color-card)',
        text: 'var(--color-foreground)',
        foreground: 'var(--color-foreground)',
        title: 'var(--color-title)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        'input-border': 'var(--color-input-border)',
        destructive: 'var(--color-destructive)',
        'primary-foreground': 'var(--color-primary-text)',
        'secondary-foreground': 'var(--color-secondary-text)',
        shell: 'var(--color-shell)',
        'shell-border': 'var(--color-shell-border)',
        input: 'var(--color-input)',
      },
      borderRadius: {
        /** Matches web ui-kit `--radius` (cards, dialogs, alerts). */
        lg: '1.25rem',
        /** Matches web ui-kit `--radius-surface` (list rows, menus, textareas). */
        md: '0.875rem',
        shell: '1.25rem',
        control: '9999px',
      },
    },
  },
  plugins: [],
}
