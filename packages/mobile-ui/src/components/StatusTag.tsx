import { Text } from 'react-native'
import { cn } from '../lib/cn'

export type StatusTagVariant =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'unverified'
  | 'verified'
  | 'super_admin'
  | 'company_admin'
  | 'member'
  | 'staff'

const VARIANT_CLASS: Record<StatusTagVariant, string> = {
  pending: 'text-amber-700',
  approved: 'text-green-700',
  rejected: 'text-red-700',
  unverified: 'text-amber-700',
  verified: 'text-teal-700',
  super_admin: 'text-violet-600',
  company_admin: 'text-sky-600',
  member: 'text-slate-500',
  staff: 'text-indigo-600',
}

const DEFAULT_LABELS: Record<StatusTagVariant, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  unverified: 'Unverified',
  verified: 'Verified',
  super_admin: 'Super Admin',
  company_admin: 'Company Owner',
  member: 'Member',
  staff: 'Staff',
}

const STATUS_TAG_VARIANTS = Object.keys(DEFAULT_LABELS) as StatusTagVariant[]

export function isStatusTagVariant(value: string): value is StatusTagVariant {
  return (STATUS_TAG_VARIANTS as string[]).includes(value)
}

export function StatusTag({
  variant,
  role,
  label,
  children,
  className,
}: {
  variant?: string | null
  /** @deprecated Use `variant`. Kept for existing mobile screens. */
  role?: string | null
  label?: string
  children?: React.ReactNode
  className?: string
}) {
  const raw = variant ?? role ?? 'pending'
  const resolved: StatusTagVariant = isStatusTagVariant(raw) ? raw : 'member'
  const text = children ?? label ?? DEFAULT_LABELS[resolved]
  const tone = VARIANT_CLASS[resolved]

  return (
    <Text className={cn('self-start text-xs font-medium', tone, className)}>{text}</Text>
  )
}
