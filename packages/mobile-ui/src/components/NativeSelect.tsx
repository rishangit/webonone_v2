import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from './Select'
import { FormField } from './FormField'

export const NATIVE_SELECT_EMPTY_VALUE = '__native_select_empty__'

export type NativeSelectOption = {
  value: string
  label: string
}

export interface NativeSelectProps {
  label?: string
  value?: string
  onValueChange: (value: string) => void
  options: NativeSelectOption[]
  placeholder?: string
  allowEmpty?: boolean
  error?: string
  required?: boolean
  hint?: string
  disabled?: boolean
  className?: string
}

/**
 * Options-based select — uses the same trigger + dropdown menu as web mobile `Select`.
 */
export function NativeSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  allowEmpty = true,
  error,
  required,
  hint,
  disabled,
  className,
}: NativeSelectProps) {
  const resolvedValue = value && value.length > 0 ? value : undefined

  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <Select
        value={resolvedValue}
        onValueChange={(next) => {
          onValueChange(next === NATIVE_SELECT_EMPTY_VALUE ? '' : next)
        }}
        placeholder={placeholder}
        disabled={disabled}
      >
        <SelectTrigger placeholder={placeholder} className={className} />
        <SelectContent>
          {allowEmpty ? (
            <SelectItem value={NATIVE_SELECT_EMPTY_VALUE}>{placeholder}</SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}
