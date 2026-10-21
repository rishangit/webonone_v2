import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

/**
 * Status chip for company approval (`draft` | `pending` | `approved` | `rejected`),
 * catalog verification (`unverified` | `verified`), and platform user roles
 * (`super_admin` | `company_admin` | `member` | `staff`).
 */
const statusTagVariants = cva('ui-tag inline-flex items-center text-xs font-medium', {
    variants: {
      variant: {
        draft: 'text-muted-foreground',
        pending: 'text-warning',
        rejected: 'text-error',
        approved: 'text-success',
        unverified: 'text-warning',
        verified: 'text-success',
        super_admin: 'text-violet-600 dark:text-violet-400',
        company_admin: 'text-sky-600 dark:text-sky-400',
        member: 'text-slate-600 dark:text-slate-400',
        staff: 'text-indigo-600 dark:text-indigo-400',
      },
    },
    defaultVariants: {
      variant: 'pending',
    },
  },
)

const DEFAULT_LABELS: Record<NonNullable<VariantProps<typeof statusTagVariants>['variant']>, string> = {
  draft: 'Draft',
  pending: 'Pending',
  rejected: 'Rejected',
  approved: 'Approved',
  unverified: 'Unverified',
  verified: 'Verified',
  super_admin: 'Super Admin',
  company_admin: 'Company Admin',
  member: 'Member',
  staff: 'Staff',
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
    <span
      data-tag-variant={resolvedVariant}
      className={cn(statusTagVariants({ variant: resolvedVariant }), className)}
      {...props}
    >
      {label}
    </span>
  )
}

export { StatusTag, statusTagVariants, isStatusTagVariant }
