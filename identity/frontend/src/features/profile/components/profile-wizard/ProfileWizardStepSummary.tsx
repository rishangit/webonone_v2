import type { ProfileFormValues } from '../../schemas/profileSchemas'

interface ProfileWizardStepSummaryProps {
  values: ProfileFormValues
  phoneDisplay: string
  email: string
  avatarUrl: string | null
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground sm:text-right">{value || '—'}</dd>
    </div>
  )
}

export function ProfileWizardStepSummary({
  values,
  phoneDisplay,
  email,
  avatarUrl,
}: ProfileWizardStepSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4">
        <div className="min-w-0 space-y-1">
          <h3 className="text-lg font-medium text-foreground">{values.displayName || '—'}</h3>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>

        <dl className="space-y-3 border-t border-[hsl(var(--glass-border))] pt-4">
          <SummaryRow label="First name" value={values.firstName} />
          <SummaryRow label="Last name" value={values.lastName} />
          <SummaryRow label="Phone" value={phoneDisplay} />
          <SummaryRow label="Locale" value={values.locale ?? ''} />
          <SummaryRow
            label="Address"
            value={[values.addressLine1, values.city, values.country].filter(Boolean).join(', ')}
          />
          <SummaryRow label="Photo" value={avatarUrl ? 'Updated' : 'Unchanged'} />
        </dl>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Review your changes, then save to update your profile.
      </p>
    </div>
  )
}
