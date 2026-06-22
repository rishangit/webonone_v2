import { Button } from '@webonone/ui-kit'
import type { ColorMode } from '@webonone/theme'

interface ColorModeToggleProps {
  value: ColorMode
  onChange: (mode: ColorMode) => void
}

export function ColorModeToggle({ value, onChange }: ColorModeToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant={value === 'light' ? 'default' : 'outline'}
        onClick={() => onChange('light')}
      >
        Light
      </Button>
      <Button
        type="button"
        variant={value === 'dark' ? 'default' : 'outline'}
        onClick={() => onChange('dark')}
      >
        Dark
      </Button>
    </div>
  )
}
