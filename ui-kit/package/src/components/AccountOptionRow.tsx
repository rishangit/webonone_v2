import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../lib/utils'
import { ImagePreview } from './ImagePreview'
import { StatusTag, isStatusTagVariant, type StatusTagVariant } from './StatusTag'

export function resolveAccountRoleVariant(role: string, accountKind?: 'staff'): StatusTagVariant {
  if (accountKind === 'staff') return 'staff'
  if (isStatusTagVariant(role)) return role
  return 'member'
}

export interface AccountOptionRowProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string
  role: string
  accountKind?: 'staff'
  companyId?: string | null
  logoUrl?: string | null
  logoAlt?: string
  selected?: boolean
}

export function AccountOptionRow({
  title,
  role,
  accountKind,
  companyId,
  logoUrl,
  logoAlt,
  selected = false,
  className,
  type = 'button',
  ...props
}: AccountOptionRowProps) {
  const roleVariant = resolveAccountRoleVariant(role, accountKind)
  const showLogo = Boolean(companyId)

  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
        selected ? 'border-primary' : 'border-border bg-glass-bg hover:border-primary/50',
        className,
      )}
      {...props}
    >
      {showLogo ? (
        <ImagePreview src={logoUrl ?? null} alt={logoAlt ?? title} className="h-10 w-10 shrink-0 rounded-md" />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{title}</span>
        <StatusTag variant={roleVariant} className="mt-1 shrink-0" />
      </span>
      {selected ? (
        <Check className="ml-auto h-5 w-5 shrink-0 self-center text-primary" aria-hidden />
      ) : null}
    </button>
  )
}
