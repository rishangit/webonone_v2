import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: {
          DEFAULT: 'hsl(var(--input))',
          background: 'hsl(var(--input-background))',
        },
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-text)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          light: 'var(--color-primary-light)',
        },
        'primary-gradient-from': 'hsl(var(--primary-gradient-from))',
        'primary-gradient-to': 'hsl(var(--primary-gradient-to))',
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-text)',
          hover: 'var(--color-secondary-hover)',
          active: 'var(--color-secondary-active)',
          light: 'var(--color-secondary-light)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)',
          active: 'var(--color-surface-active)',
          selected: 'var(--color-surface-selected)',
        },
        title: 'var(--color-text-title)',
        description: 'var(--color-text-description)',
        label: 'var(--color-text-label)',
        destructive: {
          DEFAULT: 'var(--color-error)',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          background: 'var(--color-success-background)',
          border: 'var(--color-success-border)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          background: 'var(--color-warning-background)',
          border: 'var(--color-warning-border)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          background: 'var(--color-error-background)',
          border: 'var(--color-error-border)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          background: 'var(--color-info-background)',
          border: 'var(--color-info-border)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'var(--color-text-muted)',
        },
        accent: {
          DEFAULT: 'var(--color-surface-hover)',
          foreground: 'var(--color-text)',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'var(--radius-surface, calc(var(--radius) - 4px))',
        sm: 'calc(var(--radius) - 8px)',
      },
    },
  },
  plugins: [animate],
}

export default config
