import * as React from 'react'
import { cn } from '../lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** When true, border/focus ring are provided by a parent InputGroup. */
  inGroup?: boolean
}

/** Standalone input focus — ring flush with border (no offset gap). */
export const inputFocusRingClassName =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0'

/** InputGroup shell focus — matches standalone inputFocusRingClassName. */
export const inputGroupFocusRingClassName =
  'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0'

/** Inner field inside InputGroup — no border/focus ring; spacing from group gap + pr-3. */
export const inputInGroupFieldClassName =
  'h-full min-w-0 flex-1 border-0 bg-transparent py-2 pl-0 pr-0 shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0'

export const inputInvalidClassName =
  'aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/30'

const inputSharedClassName =
  'flex w-full text-sm text-foreground placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50'

const inputStandaloneClassName = cn(
  inputSharedClassName,
  'h-10 rounded-md border border-input bg-input-background px-3 py-2',
  inputFocusRingClassName,
  inputInvalidClassName,
)

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, inGroup = false, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(inGroup ? cn(inputSharedClassName, inputInGroupFieldClassName) : inputStandaloneClassName, className)}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
