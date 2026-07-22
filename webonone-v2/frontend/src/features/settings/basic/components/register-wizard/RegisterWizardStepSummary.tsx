import type { RegisterCompanyFormValues } from '../../schemas/companySchemas'

interface RegisterWizardStepSummaryProps {
  values: RegisterCompanyFormValues
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground sm:text-right">{value || '—'}</dd>
    </div>
  )
}

export function RegisterWizardStepSummary({ values }: RegisterWizardStepSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4">
        <div className="min-w-0 space-y-1">
          <h3 className="text-lg font-medium text-foreground">{values.name}</h3>
          {values.description.trim() ? (
            <p className="text-sm text-muted-foreground">{values.description}</p>
          ) : null}
        </div>

        <dl className="space-y-3 border-t border-[hsl(var(--glass-border))] pt-4">
          <SummaryRow
            label="Company size"
            value={values.companySize ? `${values.companySize} employees` : ''}
          />
        </dl>
      </div>

      <div className="space-y-2 text-center">
        <h3 className="text-lg font-medium text-foreground">Welcome to WebOnOne!</h3>
        <p className="text-sm text-muted-foreground">
          Submit your registration to create this company as Pending. After submitting, open the
          company profile to add contact information and location (including map). A platform
          administrator will review your company before full management features unlock.
        </p>
      </div>
    </div>
  )
}
