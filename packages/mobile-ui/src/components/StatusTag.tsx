import { Text, View } from 'react-native'
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
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  unverified: 'bg-amber-100 text-amber-800',
  verified: 'bg-teal-100 text-teal-800',
  super_admin: 'bg-violet-100 text-violet-800',
  company_admin: 'bg-blue-100 text-blue-800',
  member: 'bg-slate-100 text-slate-700',
  staff: 'bg-indigo-100 text-indigo-800',
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
    <View className={cn('self-start rounded-control px-2.5 py-0.5', tone.split(' ')[0], className)}>
      <Text className={cn('text-xs font-medium', tone.split(' ')[1])}>{text}</Text>
    </View>
  )
}
