import { getPhoneCountryByIso2 } from '@webonone/ui-kit'
import type { RegisterCompanyFormValues } from '../../schemas/companySchemas'

interface RegisterWizardStepSummaryProps {
  values: RegisterCompanyFormValues
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground sm:text-right">{value}</dd>
    </div>
  )
}

export function RegisterWizardStepSummary({ values }: RegisterWizardStepSummaryProps) {
  const addressParts = [
    values.addressLine1,
    values.addressLine2,
    [values.city, values.stateRegion, values.postalCode].filter(Boolean).join(', '),
    values.countryIso2
      ? (getPhoneCountryByIso2(values.countryIso2)?.name ?? values.countryIso2)
      : '',
  ].filter(Boolean)

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4 space-y-4">
        <div className="min-w-0 space-y-1">
          <h3 className="text-lg font-medium text-foreground">{values.name}</h3>
          <p className="text-sm text-muted-foreground">{values.description}</p>
          <p className="text-xs text-muted-foreground">{values.companySize} employees</p>
        </div>

        <dl className="space-y-3 border-t border-[hsl(var(--glass-border))] pt-4">
          <SummaryRow label="Address" value={addressParts.join(', ')} />
          <SummaryRow label="Contact email" value={values.contactEmail} />
          <SummaryRow label="Contact phone" value={values.contactPhone} />
        </dl>
      </div>

      <div className="space-y-2 text-center">
        <h3 className="text-lg font-medium text-foreground">Welcome to WebOnOne!</h3>
        <p className="text-sm text-muted-foreground">
          Review your details above, then submit your registration. A platform administrator will review your
          company before you can manage business settings.
        </p>
      </div>
    </div>
  )
}
