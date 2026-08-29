import * as React from 'react'
import { cn } from '../lib/utils'
import { inputFocusRingClassName, inputInvalidClassName } from './Input'

export interface OtpInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
  className?: string
  autoFocus?: boolean
  'aria-invalid'?: boolean
}

const cellClassName = cn(
  'ui-shape-control h-10 w-10 border border-input bg-input-background text-center text-lg text-foreground',
  inputFocusRingClassName,
  inputInvalidClassName,
)

function digitsOnly(raw: string, maxLength: number): string {
  return raw.replace(/\D/g, '').slice(0, maxLength)
}

function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  id,
  className,
  autoFocus = false,
  'aria-invalid': ariaInvalid,
}: OtpInputProps) {
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([])
  const normalizedValue = digitsOnly(value, length)

  function focusCell(index: number) {
    const input = inputRefs.current[index]
    input?.focus()
    input?.select()
  }

  function handleChange(index: number, nextChar: string) {
    const digit = digitsOnly(nextChar, 1)
    if (!digit) {
      const chars = normalizedValue.split('')
      if (index < chars.length) {
        chars.splice(index, 1)
        onChange(chars.join(''))
      }
      return
    }

    const chars = normalizedValue.split('')
    if (index < chars.length) {
      chars[index] = digit
    } else {
      while (chars.length < index) {
        chars.push('')
      }
      chars.push(digit)
    }
    const next = chars.join('').slice(0, length)
    onChange(next)
    if (index < length - 1) {
      focusCell(index + 1)
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault()
      const chars = normalizedValue.split('')
      if (index < chars.length && chars[index]) {
        chars.splice(index, 1)
        onChange(chars.join(''))
        return
      }
      if (index > 0) {
        chars.splice(index - 1, 1)
        onChange(chars.join(''))
        focusCell(index - 1)
      }
      return
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      focusCell(index - 1)
      return
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault()
      focusCell(index + 1)
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const next = digitsOnly(event.clipboardData.getData('text'), length)
    if (!next) return
    onChange(next)
    focusCell(Math.min(next.length, length) - 1)
  }

  return (
    <div
      id={id}
      role="group"
      aria-label="One-time code"
      className={cn('flex gap-2', className)}
    >
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && index === 0}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-label={`Digit ${index + 1} of ${length}`}
          maxLength={1}
          value={normalizedValue[index] ?? ''}
          className={cellClassName}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.currentTarget.select()}
        />
      ))}
    </div>
  )
}

OtpInput.displayName = 'OtpInput'

export { OtpInput }
