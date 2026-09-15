import * as React from 'react'
import { cn } from '../lib/utils'
import { Label } from './Label'

export type FormAiFieldSnapshot = {
  id: string
  label: string
  name?: string
  value: string
  secret: boolean
}

type FormAiRegistry = {
  upsert: (field: FormAiFieldSnapshot) => void
  remove: (id: string) => void
  snapshot: (excludeId?: string) => { label: string; name?: string; value: string }[]
}

const FormAiContext = React.createContext<FormAiRegistry | null>(null)
const FormFieldMetaContext = React.createContext<{ htmlFor: string; label: string } | null>(null)

export function useFormAiRegistry() {
  return React.useContext(FormAiContext)
}

export function useFormFieldMeta() {
  return React.useContext(FormFieldMetaContext)
}

function FormAiProvider({ children }: { children: React.ReactNode }) {
  const fieldsRef = React.useRef(new Map<string, FormAiFieldSnapshot>())
  const registry = React.useMemo<FormAiRegistry>(
    () => ({
      upsert(field) {
        fieldsRef.current.set(field.id, field)
      },
      remove(id) {
        fieldsRef.current.delete(id)
      },
      snapshot(excludeId) {
        const out: { label: string; name?: string; value: string }[] = []
        for (const field of fieldsRef.current.values()) {
          if (field.id === excludeId || field.secret) continue
          if (!field.value.trim()) continue
          out.push({ label: field.label, name: field.name, value: field.value })
        }
        return out
      },
    }),
    [],
  )
  return <FormAiContext.Provider value={registry}>{children}</FormAiContext.Provider>
}

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

function Form({ className, ...props }: React.FormHTMLAttributes<HTMLFormElement>) {
  return (
    <FormAiProvider>
      <form className={cn('space-y-4', className)} {...props} />
    </FormAiProvider>
  )
}

function FormField({ label, htmlFor, error, required, children, className }: FormFieldProps) {
  const errorId = `${htmlFor}-error`

  const control = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id: htmlFor,
        ...(required ? { 'aria-required': true } : {}),
        ...(error
          ? {
              'aria-invalid': true,
              'aria-describedby': errorId,
            }
          : {}),
      })
    : children

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-destructive">
            {' '}
            *
          </span>
        ) : null}
      </Label>
      <FormFieldMetaContext.Provider value={{ htmlFor, label }}>{control}</FormFieldMetaContext.Provider>
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export { Form, FormField }
