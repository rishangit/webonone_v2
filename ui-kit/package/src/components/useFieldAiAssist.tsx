import * as React from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'
import { interactiveHoverTextClassName } from '../lib/selectionStyles'
import { Spinner } from './Spinner'
import { useAiFieldAssist, type AiFieldAssistControl } from './AiFieldAssist'
import { useFormAiRegistry, useFormFieldMeta } from './Form'
import { isSecretAiAssistField, shouldShowAiAssist } from './aiAssistEligibility'

function applyControlValue<T extends HTMLInputElement | HTMLTextAreaElement>(
  el: T,
  next: string,
  onChange?: React.ChangeEventHandler<T>,
) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, next)
  if (onChange) {
    onChange({ target: el, currentTarget: el } as React.ChangeEvent<T>)
  }
}

export function useFieldAiAssist<T extends HTMLInputElement | HTMLTextAreaElement>(args: {
  control: AiFieldAssistControl
  aiAssist?: boolean
  type?: string
  name?: string
  id?: string
  autoComplete?: string
  readOnly?: boolean
  disabled?: boolean
  inGroup?: boolean
  value?: string | number | readonly string[]
  defaultValue?: string | number | readonly string[]
  onChange?: React.ChangeEventHandler<T>
}) {
  const assist = useAiFieldAssist()
  const formRegistry = useFormAiRegistry()
  const fieldMeta = useFormFieldMeta()
  const [loading, setLoading] = React.useState(false)
  const fieldId = args.id ?? fieldMeta?.htmlFor ?? ''
  const label = fieldMeta?.label
  const secret = isSecretAiAssistField({
    type: args.type,
    name: args.name,
    id: args.id,
    autoComplete: args.autoComplete,
  })

  const enabled =
    Boolean(assist?.enabled) &&
    shouldShowAiAssist({
      aiAssist: args.aiAssist,
      type: args.control === 'textarea' ? 'textarea' : args.type,
      name: args.name,
      id: args.id,
      autoComplete: args.autoComplete,
      readOnly: args.readOnly,
      disabled: args.disabled,
      inGroup: args.inGroup,
    })

  const stringValue = args.value == null ? undefined : String(args.value)

  React.useEffect(() => {
    if (!formRegistry || !fieldId) return
    formRegistry.upsert({
      id: fieldId,
      label: label ?? fieldId,
      name: args.name,
      value: stringValue ?? '',
      secret,
    })
    return () => formRegistry.remove(fieldId)
  }, [formRegistry, fieldId, label, args.name, stringValue, secret])

  const onPolish = React.useCallback(
    async (el: T | null) => {
      if (!assist || !enabled || !el || loading) return
      const text = el.value.trim()
      if (!text) return
      setLoading(true)
      try {
        const formFields = formRegistry?.snapshot(fieldId)
        const next = await assist.polish({
          text: el.value,
          field: {
            name: args.name,
            label,
            control: args.control,
          },
          form: formFields && formFields.length > 0 ? { fields: formFields } : undefined,
        })
        applyControlValue(el, next, args.onChange)
        if (formRegistry && fieldId) {
          formRegistry.upsert({
            id: fieldId,
            label: label ?? fieldId,
            name: args.name,
            value: next,
            secret,
          })
        }
      } catch {
        // Host surfaces the error (toast). Leave the field unchanged.
      } finally {
        setLoading(false)
      }
    },
    [assist, enabled, loading, formRegistry, fieldId, args.name, args.control, args.onChange, label, secret],
  )

  const trackChange = React.useCallback(
    (event: React.ChangeEvent<T>) => {
      if (formRegistry && fieldId) {
        formRegistry.upsert({
          id: fieldId,
          label: label ?? fieldId,
          name: args.name,
          value: event.target.value,
          secret,
        })
      }
      args.onChange?.(event)
    },
    [formRegistry, fieldId, label, args, secret],
  )

  return { enabled, loading, onPolish, trackChange }
}

export function AiAssistIconButton({
  loading,
  disabled,
  onClick,
  className,
}: {
  loading: boolean
  disabled?: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className={cn(
        'absolute z-10 flex h-7 w-7 items-center justify-center rounded-sm bg-transparent text-muted-foreground transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
        interactiveHoverTextClassName,
        className,
      )}
      aria-label="Improve writing"
      disabled={disabled || loading}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {loading ? <Spinner size="sm" className="h-3.5 w-3.5 border" /> : <Sparkles className="h-3.5 w-3.5" aria-hidden />}
    </button>
  )
}
