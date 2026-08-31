import { Mail, Phone, type LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'

export type ContactKind = 'email' | 'phone'

const CONTACT_ICONS: Record<ContactKind, LucideIcon> = {
  email: Mail,
  phone: Phone,
}

export interface ContactValueLineProps {
  kind: ContactKind
  value?: string | null
  emptyLabel?: string
  className?: string
  /** `list` — compact muted subtitle; `detail` — body text on detail cards */
  variant?: 'list' | 'detail'
}

export function ContactValueLine({
  kind,
  value,
  emptyLabel,
  className,
  variant = 'list',
}: ContactValueLineProps) {
  const Icon = CONTACT_ICONS[kind]
  const display = value?.trim() ? value : (emptyLabel ?? '—')

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1.5',
        variant === 'list' ? 'text-xs text-muted-foreground' : 'text-sm text-foreground',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 truncate">{display}</span>
    </div>
  )
}
