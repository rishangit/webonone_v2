import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@webonone/ui-kit'
import { THEME_TOKEN_NONE } from './types'

export type ThemeTokenOption = {
  id: string
  label: string
  swatch?: string
}

type ThemeTokenSelectProps = {
  id: string
  value: string
  options: ThemeTokenOption[]
  noneLabel: string
  onChange: (id: string) => void
  disabled?: boolean
  'aria-required'?: boolean
  'aria-invalid'?: boolean | 'true' | 'false'
  'aria-describedby'?: string
}

export function ThemeTokenSelect({
  id,
  value,
  options,
  noneLabel,
  onChange,
  disabled,
  ...triggerProps
}: ThemeTokenSelectProps) {
  return (
    <Select
      value={value || THEME_TOKEN_NONE}
      onValueChange={(next) => onChange(next === THEME_TOKEN_NONE ? '' : next)}
      disabled={disabled}
    >
      <SelectTrigger id={id} {...triggerProps}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={THEME_TOKEN_NONE}>{noneLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.swatch ? (
              <span className="flex items-center gap-2">
                <span
                  className="h-4 w-4 shrink-0 rounded-sm border border-[hsl(var(--glass-border))]"
                  style={{ backgroundColor: option.swatch }}
                />
                {option.label}
              </span>
            ) : (
              option.label
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
