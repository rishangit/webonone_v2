import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'
import { inputGroupFocusRingClassName } from './Input'

interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  invalid?: boolean
}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, invalid, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    const isInvalid = invalid || ariaInvalid === true || ariaInvalid === 'true'
    return (
      <div
        ref={ref}
        className={cn(
          'flex h-10 w-full items-center gap-2 overflow-hidden rounded-md border border-input bg-input-background px-3',
          inputGroupFocusRingClassName,
          isInvalid && 'border-destructive focus-within:ring-destructive/30',
          className,
        )}
        aria-invalid={isInvalid || undefined}
        {...props}
      />
    )
  },
)
InputGroup.displayName = 'InputGroup'

function InputGroupText({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'flex h-full shrink-0 items-center border-r border-input bg-muted/50 py-2 pl-0 pr-3 text-sm text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

interface InputGroupIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon: LucideIcon
  position?: 'leading' | 'trailing'
}

function InputGroupIcon({ icon: Icon, position = 'leading', className, ...props }: InputGroupIconProps) {
  return (
    <span
      className={cn(
        'flex h-full shrink-0 items-center text-muted-foreground',
        position === 'trailing' ? 'pr-0' : undefined,
        className,
      )}
      {...props}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
    </span>
  )
}

export { InputGroup, InputGroupText, InputGroupIcon }
