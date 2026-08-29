import { useCallback, useEffect, useState } from 'react'
import {
  applyColorMode,
  applyThemeVariables,
  applyUiTheme,
  UI_THEMES,
  type ColorMode,
  type UiThemeId,
} from '@webonone/theme'
import { Button } from '@webonone/ui-kit'

const PLATFORM_DEFAULT = {
  id: 'platform-default',
  name: 'Platform Default',
  color1: '#344CE2',
  color2: '#3578E8',
  color3: '#3578E8',
  color4: '#EFF3FA',
  color5: '#0E2F59',
}

const ALT_PALETTE = {
  id: 'alt',
  name: 'Forest',
  color1: '#059669',
  color2: '#10b981',
  color3: '#84cc16',
  color4: '#f0fdf4',
  color5: '#14532d',
}

const PALETTES = [PLATFORM_DEFAULT, ALT_PALETTE]

const UI_THEME_LABELS: Record<UiThemeId, string> = {
  classic: 'Classic',
  'high-tech': 'High-tech',
}

type ThemeToolbarProps = {
  uiTheme: UiThemeId
  onUiThemeChange: (theme: UiThemeId) => void
}

export function ThemeToolbar({ uiTheme, onUiThemeChange }: ThemeToolbarProps) {
  const [colorMode, setColorMode] = useState<ColorMode>('light')
  const [activePaletteId, setActivePaletteId] = useState(PLATFORM_DEFAULT.id)

  const applyPalette = useCallback((paletteId: string, mode: ColorMode) => {
    const palette = PALETTES.find((p) => p.id === paletteId) ?? PLATFORM_DEFAULT
    applyColorMode(mode)
    applyThemeVariables({ theme: palette, colorMode: mode })
  }, [])

  useEffect(() => {
    applyPalette(activePaletteId, colorMode)
  }, [activePaletteId, colorMode, applyPalette])

  useEffect(() => {
    applyUiTheme(uiTheme)
  }, [uiTheme])

  function toggleMode() {
    setColorMode((m) => (m === 'light' ? 'dark' : 'light'))
  }

  return (
    <div className="sticky top-0 z-40 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={toggleMode}>
          {colorMode === 'light' ? 'Dark mode' : 'Light mode'}
        </Button>
        <div className="flex flex-wrap gap-2">
          {PALETTES.map((palette) => (
            <Button
              key={palette.id}
              variant={activePaletteId === palette.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePaletteId(palette.id)}
            >
              {palette.name}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {UI_THEMES.map(({ id }) => (
            <Button
              key={id}
              variant={uiTheme === id ? 'default' : 'outline'}
              size="sm"
              onClick={() => onUiThemeChange(id)}
            >
              {UI_THEME_LABELS[id]}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm">Primary</Button>
          <Button variant="link" size="sm">
            Link
          </Button>
        </div>
        <div className="flex gap-1">
          {(['color1', 'color2', 'color3', 'color4', 'color5'] as const).map((name, i) => (
            <span
              key={name}
              className="h-6 w-6 rounded border"
              style={{ backgroundColor: `var(--color-${i + 1})` }}
              title={name}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
