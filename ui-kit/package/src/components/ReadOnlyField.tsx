import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'

export interface ReadOnlyFieldProps {
  label: string
  value?: ReactNode
  icon?: LucideIcon
  className?: string
  valueClassName?: string
}

function isEmptyReadOnlyValue(value: ReactNode): boolean {
  if (value == null || value === false) return true
  if (typeof value === 'string') return value.trim().length === 0
  return false
}

function isInlineReadOnlyValue(value: ReactNode): boolean {
  const type = typeof value
  return type === 'string' || type === 'number' || type === 'boolean'
}

export function ReadOnlyField({
  label,
  value,
  icon: Icon,
  className,
  valueClassName,
}: ReadOnlyFieldProps) {
  const display = isEmptyReadOnlyValue(value) ? '—' : value
  const isBlockValue = !isEmptyReadOnlyValue(value) && !isInlineReadOnlyValue(value)

  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-label">{label}</p>
      <div
        className={cn(
          'text-sm',
          isBlockValue ? 'flex w-full flex-col items-stretch gap-2' : 'flex items-center gap-2',
          valueClassName,
        )}
      >
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
        {isBlockValue ? (
          <div className="w-full min-w-0">{display}</div>
        ) : (
          <span className="min-w-0 break-all">{display}</span>
        )}
      </div>
    </div>
  )
}
