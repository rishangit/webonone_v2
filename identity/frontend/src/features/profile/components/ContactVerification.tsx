import { Mail, Phone } from 'lucide-react'
import { Button, StatusTag } from '@webonone/ui-kit'
import type { ContactKind } from '@webonone/ui-kit'

const CONTACT_ICONS = { email: Mail, phone: Phone } as const

export function VerificationStatusTag({ verified }: { verified: boolean }) {
  return <StatusTag variant={verified ? 'verified' : 'unverified'} />
}

export function ContactVerifiedRow({
  label,
  value,
  verified,
  canVerify,
  onVerify,
  verifyLabel,
  kind,
}: {
  label: string
  value: string | null | undefined
  verified: boolean
  canVerify?: boolean
  onVerify?: () => void
  verifyLabel: string
  kind: ContactKind
}) {
  const Icon = CONTACT_ICONS[kind]
  const display = value?.trim() ? value : '—'
  const showVerify = Boolean(canVerify && value?.trim() && !verified && onVerify)

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 break-all">{display}</span>
        {value?.trim() ? <VerificationStatusTag verified={verified} /> : null}
        {showVerify ? (
          <Button type="button" variant="outline" size="sm" onClick={onVerify}>
            {verifyLabel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
