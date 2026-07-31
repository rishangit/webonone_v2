import { Button, StatusTag } from '@webonone/ui-kit'

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
}: {
  label: string
  value: string | null | undefined
  verified: boolean
  canVerify?: boolean
  onVerify?: () => void
  verifyLabel: string
}) {
  const display = value?.trim() ? value : '—'
  const showVerify = Boolean(canVerify && value?.trim() && !verified && onVerify)

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
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
