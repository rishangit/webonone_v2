import { COLOR_SELECT_NONE } from './ColorSelect'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'

export type ColorPaletteSelectOption = {
  id: string
  name: string
  colors: string[]
}

export type ColorPaletteSelectProps = {
  id?: string
  value: string
  options: ColorPaletteSelectOption[]
  /** Label for the first item, which clears the palette. */
  noneLabel?: string
  placeholder?: string
  onChange: (id: string) => void
  disabled?: boolean
}

function ColorSwatchStrip({ colors }: { colors: string[] }) {
  if (colors.length === 0) return null
  return (
    <span
      className="flex shrink-0 overflow-hidden rounded-md border border-[hsl(var(--glass-border))]"
      aria-hidden
    >
      {colors.map((value, index) => (
        <span key={`${value}-${index}`} className="h-5 w-5" style={{ backgroundColor: value }} />
      ))}
    </span>
  )
}

export function ColorPaletteSelect({
  id,
  value,
  options,
  noneLabel = 'None',
  placeholder,
  onChange,
  disabled,
}: ColorPaletteSelectProps) {
  return (
    <Select
      value={value || COLOR_SELECT_NONE}
      onValueChange={(next) => onChange(next === COLOR_SELECT_NONE ? '' : next)}
      disabled={disabled}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder ?? noneLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={COLOR_SELECT_NONE}>{noneLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            <span className="flex min-w-0 items-center gap-2">
              <ColorSwatchStrip colors={option.colors} />
              <span className="truncate">{option.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
