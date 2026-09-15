import * as React from 'react'
import { cn } from '../lib/utils'
import { AiAssistIconButton, useFieldAiAssist } from './useFieldAiAssist'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Show in-field AI polish when the app provider is enabled. Default is auto (skip identifiers). */
  aiAssist?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, aiAssist, onChange, name, id, autoComplete, readOnly, disabled, value, defaultValue, ...props },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null)
    const { enabled, loading, onPolish, trackChange } = useFieldAiAssist<HTMLTextAreaElement>({
      control: 'textarea',
      aiAssist,
      type: 'textarea',
      name,
      id,
      autoComplete,
      readOnly,
      disabled,
      value,
      defaultValue,
      onChange,
    })

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    const textarea = (
      <textarea
        ref={setRefs}
        id={id}
        name={name}
        autoComplete={autoComplete}
        readOnly={readOnly}
        disabled={disabled}
        value={value}
        defaultValue={defaultValue}
        onChange={enabled ? trackChange : onChange}
        className={cn(
          'ui-shape-control flex min-h-[80px] w-full border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/30',
          enabled && 'pr-9',
          className,
        )}
        {...props}
      />
    )

    if (!enabled) return textarea

    return (
      <div className="relative w-full">
        {textarea}
        <AiAssistIconButton
          loading={loading}
          className="right-1.5 top-1.5"
          onClick={() => void onPolish(innerRef.current)}
        />
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
