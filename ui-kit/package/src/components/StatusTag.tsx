import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const statusTagVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm',
  {
    variants: {
      variant: {
        pending:
          'border-amber-600/55 bg-amber-500/15 text-amber-900 dark:border-amber-400/50 dark:bg-amber-500/20 dark:text-amber-200',
        rejected:
          'border-red-600/55 bg-red-500/15 text-red-900 dark:border-red-400/50 dark:bg-red-500/20 dark:text-red-200',
        approved:
          'border-emerald-600/55 bg-emerald-500/15 text-emerald-900 dark:border-emerald-400/50 dark:bg-emerald-500/20 dark:text-emerald-200',
      },
    },
    defaultVariants: {
      variant: 'pending',
    },
  },
)

const DEFAULT_LABELS: Record<NonNullable<VariantProps<typeof statusTagVariants>['variant']>, string> = {
  pending: 'Pending',
  rejected: 'Rejected',
  approved: 'Approved',
}

export type StatusTagVariant = NonNullable<VariantProps<typeof statusTagVariants>['variant']>

export interface StatusTagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusTagVariants> {}

function StatusTag({ className, variant = 'pending', children, ...props }: StatusTagProps) {
  const resolvedVariant: StatusTagVariant = variant ?? 'pending'
  const label = children ?? DEFAULT_LABELS[resolvedVariant]

  return (
    <span className={cn(statusTagVariants({ variant: resolvedVariant }), className)} {...props}>
      {label}
    </span>
  )
}

export { StatusTag, statusTagVariants }
