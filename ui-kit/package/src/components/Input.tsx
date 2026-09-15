import * as React from 'react'
import { cn } from '../lib/utils'
import { AiAssistIconButton, useFieldAiAssist } from './useFieldAiAssist'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** When true, border/focus ring are provided by a parent InputGroup. */
  inGroup?: boolean
  /** Show in-field AI polish when the app provider is enabled. Default is auto (skip identifiers). */
  aiAssist?: boolean
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
  'flex w-full text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--color-text)] disabled:cursor-not-allowed disabled:text-[var(--color-text-disabled)] disabled:opacity-50'

const inputStandaloneClassName = cn(
  inputSharedClassName,
  'ui-shape-control h-10 border border-[var(--color-border)] bg-transparent px-3 py-2 hover:border-[var(--color-border-hover)]',
  inputFocusRingClassName,
  inputInvalidClassName,
)

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, inGroup = false, aiAssist, onChange, type, name, id, autoComplete, readOnly, disabled, value, defaultValue, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null)
    const { enabled, loading, onPolish, trackChange } = useFieldAiAssist<HTMLInputElement>({
      control: 'input',
      aiAssist,
      type,
      name,
      id,
      autoComplete,
      readOnly,
      disabled,
      inGroup,
      value,
      defaultValue,
      onChange,
    })

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    const input = (
      <input
        ref={setRefs}
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        readOnly={readOnly}
        disabled={disabled}
        value={value}
        defaultValue={defaultValue}
        onChange={enabled ? trackChange : onChange}
        className={cn(
          inGroup ? cn(inputSharedClassName, inputInGroupFieldClassName) : inputStandaloneClassName,
          enabled && !inGroup && 'pr-9',
          className,
        )}
        {...props}
      />
    )

    if (!enabled) return input

    return (
      <div className="relative w-full">
        {input}
        <AiAssistIconButton
          loading={loading}
          className="right-1.5 top-1/2 -translate-y-1/2"
          onClick={() => void onPolish(innerRef.current)}
        />
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
