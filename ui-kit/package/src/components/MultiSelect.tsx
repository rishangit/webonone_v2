import * as React from 'react'
import { Check, ChevronsUpDown, X, type LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'
import { Checkbox } from './Checkbox'
import { inputGroupFocusRingClassName } from './Input'
import { Label } from './Label'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'

export interface MultiSelectOption {
  value: string
  label: string
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  /** Leading icon — trigger matches Input/Select height and spacing. */
  leadingIcon?: LucideIcon
}

function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Select options',
  disabled,
  className,
  id,
  leadingIcon: LeadingIcon,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  function toggleOption(optionValue: string) {
    if (value.includes(optionValue)) {
      onValueChange(value.filter((v) => v !== optionValue))
    } else {
      onValueChange([...value, optionValue])
    }
  }

  function removeChip(optionValue: string, e: React.MouseEvent) {
    e.stopPropagation()
    onValueChange(value.filter((v) => v !== optionValue))
  }

  const selectedLabels = options.filter((o) => value.includes(o.value))

  const triggerBody = (
    <>
      {LeadingIcon ? (
        <LeadingIcon className="h-4 w-4 shrink-0 self-center text-muted-foreground" aria-hidden />
      ) : null}
      <span className="flex min-w-0 flex-1 flex-wrap gap-1 text-left">
        {selectedLabels.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          selectedLabels.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs"
            >
              {opt.label}
              <button
                type="button"
                className="rounded-sm hover:bg-accent"
                onClick={(e) => removeChip(opt.value, e)}
                aria-label={`Remove ${opt.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 self-center opacity-50" />
    </>
  )

  const triggerProps = {
    id,
    type: 'button' as const,
    role: 'combobox' as const,
    'aria-expanded': open,
    disabled,
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          {...triggerProps}
          className={cn(
            'flex min-h-10 w-full items-center gap-2 rounded-md border border-input bg-input-background px-3 py-2 text-sm font-normal text-foreground hover:bg-input-background focus-visible:bg-input-background data-[state=open]:bg-input-background disabled:cursor-not-allowed disabled:opacity-50',
            inputGroupFocusRingClassName,
            className,
          )}
        >
          {triggerBody}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
        <div className="max-h-60 space-y-1 overflow-y-auto">
          {options.map((option) => {
            const checked = value.includes(option.value)
            const inputId = `${id ?? 'multi'}-${option.value}`
            return (
              <div
                key={option.value}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent"
              >
                <Checkbox
                  id={inputId}
                  checked={checked}
                  onCheckedChange={() => toggleOption(option.value)}
                />
                <Label htmlFor={inputId} className="flex-1 cursor-pointer font-normal">
                  {option.label}
                </Label>
                {checked ? <Check className="h-4 w-4 text-primary" /> : null}
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { MultiSelect }
