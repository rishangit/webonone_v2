import * as React from 'react'
import { cn } from '../lib/utils'
import { isValidHexColor, normalizeHexColor } from '../lib/normalizeHexColor'
import { Input, type InputProps } from './Input'
import { InputGroup } from './InputGroup'

const colorPickerClassName =
  'h-8 w-10 shrink-0 cursor-pointer ui-shape-control border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-none [&::-webkit-color-swatch]:border [&::-webkit-color-swatch]:border-input'

export interface ColorInputProps extends Omit<InputProps, 'type' | 'value' | 'defaultValue' | 'onChange'> {
  value: string
  onChange?: (value: string) => void
}

const ColorInput = React.forwardRef<HTMLInputElement, ColorInputProps>(
  ({ className, value, onChange, disabled, id, ...props }, ref) => {
    const pickerValue = isValidHexColor(value) ? normalizeHexColor(value) : '#000000'
    const pickerId = id ? `${id}-picker` : undefined

    return (
      <InputGroup
        invalid={props['aria-invalid'] === true || props['aria-invalid'] === 'true'}
        aria-invalid={props['aria-invalid']}
      >
        <input
          id={pickerId}
          type="color"
          value={pickerValue}
          disabled={disabled}
          className={colorPickerClassName}
          aria-label="Pick color"
          onChange={(event) => onChange?.(event.target.value.toUpperCase())}
        />
        <Input
          ref={ref}
          id={id}
          inGroup
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="#2563EB"
          maxLength={7}
          value={value}
          disabled={disabled}
          className={cn('font-mono uppercase', className)}
          onChange={(event) => onChange?.(event.target.value)}
          {...props}
        />
      </InputGroup>
    )
  },
)
ColorInput.displayName = 'ColorInput'

export { ColorInput }
