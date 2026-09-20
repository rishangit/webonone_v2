import { View } from 'react-native'
import { TextField } from '@webonone/mobile-ui'
import type { CompanyWizardFormValues } from '@/features/companies/schemas/companySchemas'

export function CompanyWizardStepAddress({
  values,
  fieldErrors,
  isSubmitting,
  requireAll = false,
  onChange,
}: {
  values: CompanyWizardFormValues
  fieldErrors: Partial<Record<keyof CompanyWizardFormValues, string>>
  isSubmitting: boolean
  requireAll?: boolean
  onChange: (patch: Partial<CompanyWizardFormValues>) => void
}) {
  return (
    <View className="gap-4">
      <TextField
        label="Address line 1"
        required={requireAll}
        value={values.addressLine1}
        onChangeText={(addressLine1) => onChange({ addressLine1 })}
        editable={!isSubmitting}
        error={fieldErrors.addressLine1}
      />
      <TextField
        label="Address line 2"
        value={values.addressLine2}
        onChangeText={(addressLine2) => onChange({ addressLine2 })}
        editable={!isSubmitting}
        error={fieldErrors.addressLine2}
      />
      <TextField
        label="City"
        required={requireAll}
        value={values.city}
        onChangeText={(city) => onChange({ city })}
        editable={!isSubmitting}
        error={fieldErrors.city}
      />
      <TextField
        label="State / region"
        value={values.stateRegion}
        onChangeText={(stateRegion) => onChange({ stateRegion })}
        editable={!isSubmitting}
        error={fieldErrors.stateRegion}
      />
      <TextField
        label="Postal code"
        value={values.postalCode}
        onChangeText={(postalCode) => onChange({ postalCode })}
        editable={!isSubmitting}
        error={fieldErrors.postalCode}
      />
      <TextField
        label="Country"
        required={requireAll}
        value={values.country}
        onChangeText={(country) => onChange({ country: country.toUpperCase().slice(0, 2) })}
        editable={!isSubmitting}
        autoCapitalize="characters"
        hint="2-letter code, e.g. LK"
        error={fieldErrors.country}
      />
    </View>
  )
}
