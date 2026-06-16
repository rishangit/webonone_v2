import * as React from 'react'
import { cn } from '../lib/utils'
import { Label } from './Label'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
  className?: string
}

function Form({ className, ...props }: React.FormHTMLAttributes<HTMLFormElement>) {
  return <form className={cn('space-y-4', className)} {...props} />
}

function FormField({ label, htmlFor, error, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

export { Form, FormField }
