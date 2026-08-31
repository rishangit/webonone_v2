import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

/**
 * Status chip for company approval (`pending` | `approved` | `rejected`),
 * catalog verification (`unverified` | `verified`), and platform user roles
 * (`super_admin` | `company_admin` | `member` | `staff`).
 */
const statusTagVariants = cva(
  'ui-tag inline-flex items-center ui-shape-panel-sm border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm',
  {
    variants: {
      variant: {
        pending: 'border-warning-border bg-warning-background text-warning',
        rejected: 'border-error-border bg-error-background text-error',
        approved: 'border-success-border bg-success-background text-success',
        unverified: 'border-warning-border bg-warning-background text-warning',
        verified: 'border-success-border bg-success-background text-success',
        super_admin: 'border-info-border bg-info-background text-info',
        company_admin: 'border-info-border bg-info-background text-info',
        member: 'border-[var(--color-border-light)] bg-surface-hover text-[var(--color-text-secondary)]',
        staff: 'border-[var(--color-border-light)] bg-primary-light text-primary',
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
