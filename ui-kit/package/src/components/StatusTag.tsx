import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

/**
 * Status chip for company approval (`pending` | `approved` | `rejected`),
 * catalog verification (`unverified` | `verified`), and platform user roles
 * (`super_admin` | `company_admin` | `member`).
 */
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
        unverified:
          'border-orange-600/55 bg-orange-500/15 text-orange-900 dark:border-orange-400/50 dark:bg-orange-500/20 dark:text-orange-200',
        verified:
          'border-teal-600/55 bg-teal-500/15 text-teal-900 dark:border-teal-400/50 dark:bg-teal-500/20 dark:text-teal-200',
        super_admin:
          'border-violet-600/55 bg-violet-500/15 text-violet-900 dark:border-violet-400/50 dark:bg-violet-500/20 dark:text-violet-200',
        company_admin:
          'border-sky-600/55 bg-sky-500/15 text-sky-900 dark:border-sky-400/50 dark:bg-sky-500/20 dark:text-sky-200',
        member:
          'border-slate-600/55 bg-slate-500/15 text-slate-900 dark:border-slate-400/50 dark:bg-slate-500/20 dark:text-slate-200',
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
  unverified: 'Unverified',
  verified: 'Verified',
  super_admin: 'Super Admin',
  company_admin: 'Company Admin',
  member: 'Member',
}

export type StatusTagVariant = NonNullable<VariantProps<typeof statusTagVariants>['variant']>

const STATUS_TAG_VARIANTS = Object.keys(DEFAULT_LABELS) as StatusTagVariant[]

/** Type guard: true when `value` is a known StatusTag variant key. */
function isStatusTagVariant(value: string): value is StatusTagVariant {
  return (STATUS_TAG_VARIANTS as string[]).includes(value)
}

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

export { StatusTag, statusTagVariants, isStatusTagVariant }
