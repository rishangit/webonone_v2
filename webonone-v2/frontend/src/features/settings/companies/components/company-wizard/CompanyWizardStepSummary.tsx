import { ContactValueLine, type ContactKind } from '@webonone/ui-kit'
import type { CompanyWizardFormValues } from '@/features/settings/basic/schemas/companySchemas'
import { formatCountryName } from '@/features/settings/companies/utils/formatCountryName'

interface CompanyWizardStepSummaryProps {
  values: CompanyWizardFormValues
  isNew: boolean
  contactPhoneDisplay: string
}

function SummaryContactRow({
  label,
  kind,
  value,
}: {
  label: string
  kind: ContactKind
  value: string
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="sm:text-right">
        <ContactValueLine kind={kind} value={value} variant="detail" className="sm:justify-end" />
      </dd>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground sm:text-right">{value || '—'}</dd>
    </div>
  )
}

export function CompanyWizardStepSummary({
  values,
  isNew,
  contactPhoneDisplay,
}: CompanyWizardStepSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4">
        <div className="min-w-0 space-y-1">
          <h3 className="text-lg font-medium text-foreground">{values.name || '—'}</h3>
          {values.description.trim() ? (
            <p className="text-sm text-muted-foreground">{values.description}</p>
          ) : null}
        </div>

        <dl className="space-y-3 border-t border-[hsl(var(--glass-border))] pt-4">
          <SummaryRow
            label="Company size"
            value={values.companySize ? `${values.companySize} employees` : ''}
          />
          <SummaryRow
            label="Contact person"
            value={values.contactPerson?.displayName ?? ''}
          />
          <SummaryContactRow label="Contact email" kind="email" value={values.contactEmail} />
          <SummaryContactRow label="Contact phone" kind="phone" value={contactPhoneDisplay} />
          <SummaryRow
            label="Address"
            value={[values.addressLine1, values.city, formatCountryName(values.country)]
              .filter(Boolean)
              .join(', ')}
          />
          <SummaryRow
            label="Map location"
            value={
              values.latitude !== null && values.longitude !== null
                ? (values.mapFormattedAddress ??
                  `${values.latitude.toFixed(5)}, ${values.longitude.toFixed(5)}`)
                : ''
            }
          />
          <SummaryRow
            label="Tags"
            value={values.tags.length > 0 ? values.tags.map((t) => t.name).join(', ') : ''}
          />
        </dl>
      </div>

      <div className="space-y-2 text-center">
        {isNew ? (
          <>
            <h3 className="text-lg font-medium text-foreground">Welcome to WebOnOne!</h3>
            <p className="text-sm text-muted-foreground">
              Submit your registration to create this company as Pending. A platform administrator
              will review your company before full management features unlock. You can finish any
              missing details later from the company profile.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Review your changes, then save to update the company profile.
          </p>
        )}
      </div>
    </div>
  )
}
