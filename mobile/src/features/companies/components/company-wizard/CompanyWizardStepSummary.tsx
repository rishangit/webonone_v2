import { View } from 'react-native'
import { Body, Muted, Subheading } from '@webonone/mobile-ui'
import type { CompanyWizardFormValues } from '@/features/companies/schemas/companySchemas'
import { formatCountryName } from '@/features/companies/utils/formatCountryName'

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <Muted className="shrink-0">{label}</Muted>
      <Body className="flex-1 text-right font-medium">{value || '—'}</Body>
    </View>
  )
}

export function CompanyWizardStepSummary({
  values,
  isNew,
  contactPhoneDisplay,
}: {
  values: CompanyWizardFormValues
  isNew: boolean
  contactPhoneDisplay: string
}) {
  const address = [values.addressLine1, values.city, formatCountryName(values.country)]
    .filter(Boolean)
    .join(', ')

  const mapLocation =
    values.latitude != null && values.longitude != null
      ? (values.mapFormattedAddress ?? `${values.latitude}, ${values.longitude}`)
      : ''

  return (
    <View className="gap-6">
      <View className="gap-4 rounded-lg border border-border bg-card p-4">
        <View className="gap-1">
          <Subheading>{values.name || '—'}</Subheading>
          {values.description.trim() ? <Muted>{values.description}</Muted> : null}
        </View>

        <View className="gap-3 border-t border-border pt-4">
          <SummaryRow
            label="Company size"
            value={values.companySize ? `${values.companySize} employees` : ''}
          />
          <SummaryRow label="Contact person" value={values.contactPerson?.displayName ?? ''} />
          <SummaryRow label="Contact email" value={values.contactEmail} />
          <SummaryRow label="Contact phone" value={contactPhoneDisplay} />
          <SummaryRow label="Address" value={address} />
          <SummaryRow label="Map location" value={mapLocation} />
          <SummaryRow
            label="Tags"
            value={values.tags.length > 0 ? values.tags.map((tag) => tag.name).join(', ') : ''}
          />
        </View>
      </View>

      {isNew ? (
        <View className="gap-2">
          <Subheading className="text-center">Welcome to WebOnOne!</Subheading>
          <Muted className="text-center">
            Submit your registration to create this company as Pending. A platform administrator
            will review your company before full management features unlock.
          </Muted>
        </View>
      ) : (
        <Muted className="text-center">
          Review your changes, then save to update the company profile.
        </Muted>
      )}
    </View>
  )
}
