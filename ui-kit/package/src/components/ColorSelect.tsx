import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'

/** Select value used for the empty color. `onChange` receives `''` instead. */
export const COLOR_SELECT_NONE = '__none'

export type ColorSelectOption = {
  id: string
  label: string
  swatch?: string
}

export type ColorSelectProps = {
  id?: string
  value: string
  options: ColorSelectOption[]
  /** Label for the first item, which clears the color. */
  noneLabel?: string
  placeholder?: string
  onChange: (id: string) => void
  disabled?: boolean
  'aria-required'?: boolean
  'aria-invalid'?: boolean | 'true' | 'false'
  'aria-describedby'?: string
}

export function ColorSelect({
  id,
  value,
  options,
  noneLabel = 'None',
  placeholder,
  onChange,
  disabled,
  ...triggerProps
}: ColorSelectProps) {
  return (
    <Select
      value={value || COLOR_SELECT_NONE}
      onValueChange={(next) => onChange(next === COLOR_SELECT_NONE ? '' : next)}
      disabled={disabled}
    >
      <SelectTrigger id={id} {...triggerProps}>
        <SelectValue placeholder={placeholder ?? noneLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={COLOR_SELECT_NONE}>{noneLabel}</SelectItem>
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
