import * as React from 'react'
import { cn } from '../lib/utils'
import { Label } from './Label'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

function Form({ className, ...props }: React.FormHTMLAttributes<HTMLFormElement>) {
  return <form className={cn('space-y-4', className)} {...props} />
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
      {control}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export { Form, FormField }
