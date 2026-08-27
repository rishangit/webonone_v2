import * as React from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '../lib/utils'
import { Input, inputFocusRingClassName, inputGroupFocusRingClassName } from './Input'
import { InputGroup, InputGroupIcon } from './InputGroup'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'
import { Calendar } from './Calendar'
import { formatPickerDate } from '../lib/displayDateFormat'

export interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  /** Forwarded to Calendar — disabled days are not selectable. */
  isDateDisabled?: (date: Date) => boolean
  withIcon?: boolean
  className?: string
  id?: string
  /** BCP-47 tag for the visible date label (default `en-US`). */
  locale?: string
}

function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  isDateDisabled,
  withIcon = false,
  className,
  id,
  locale = 'en-US',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const trigger = withIcon ? (
    <InputGroup className="pointer-events-none focus-within:ring-0">
      <InputGroupIcon icon={CalendarIcon} />
      <Input
        id={id}
        inGroup
        readOnly
        disabled={disabled}
        value={value ? formatPickerDate(value, locale) : ''}
        placeholder={placeholder}
        className="cursor-pointer"
        tabIndex={-1}
      />
    </InputGroup>
  ) : (
    <Input
      id={id}
      readOnly
      disabled={disabled}
      value={value ? formatPickerDate(value, locale) : ''}
      placeholder={placeholder}
      className="cursor-pointer"
      tabIndex={-1}
    />
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'block h-10 w-full min-w-0 rounded-md border-0 bg-transparent p-0 text-left shadow-none outline-none',
            withIcon && inputGroupFocusRingClassName,
            !withIcon && inputFocusRingClassName,
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          disabled={disabled}
        >
          {trigger}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          selected={value}
          isDateDisabled={isDateDisabled}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
