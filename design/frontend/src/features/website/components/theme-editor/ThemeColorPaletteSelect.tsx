import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@webonone/ui-kit'
import type { WebsiteColorLibraryPalette } from '../../types'
import { ColorPaletteSwatchStrip } from '../ColorPaletteSwatchStrip'
import { THEME_TOKEN_NONE } from './types'

export type ThemeColorPaletteSelectOption = {
  id: string
  name: string
  palette: WebsiteColorLibraryPalette
}

export function ThemeColorPaletteSelect({
  id,
  value,
  options,
  placeholder,
  onChange,
  disabled,
  allowNone = false,
  noneLabel,
}: {
  id: string
  value: string
  options: ThemeColorPaletteSelectOption[]
  placeholder?: string
  onChange: (id: string) => void
  disabled?: boolean
  allowNone?: boolean
  noneLabel?: string
}) {
  return (
    <Select
      value={allowNone ? value || THEME_TOKEN_NONE : value || undefined}
      onValueChange={(next) => onChange(next === THEME_TOKEN_NONE ? '' : next)}
      disabled={disabled}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone ? <SelectItem value={THEME_TOKEN_NONE}>{noneLabel}</SelectItem> : null}
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            <span className="flex min-w-0 items-center gap-2">
              <ColorPaletteSwatchStrip palette={option.palette} sizeClassName="h-5 w-5" />
              <span className="truncate">{option.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
