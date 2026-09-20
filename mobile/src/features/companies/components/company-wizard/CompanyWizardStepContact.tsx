import { View } from 'react-native'
import { Body, PhoneInput, SelectUser, TextField } from '@webonone/mobile-ui'
import type { CompanyWizardFormValues } from '@/features/companies/schemas/companySchemas'

export function CompanyWizardStepContact({
  values,
  fieldErrors,
  isSubmitting,
  requireAll = false,
  onChange,
  onOpenContactPersonPicker,
}: {
  values: CompanyWizardFormValues
  fieldErrors: Partial<
    Record<keyof CompanyWizardFormValues | 'contactPhone' | 'contactPerson', string>
  >
  isSubmitting: boolean
  requireAll?: boolean
  onChange: (patch: Partial<CompanyWizardFormValues>) => void
  onOpenContactPersonPicker: () => void
}) {
  const selectedContactPerson = values.contactPerson
    ? {
        id: values.contactPerson.id,
        displayName: values.contactPerson.displayName,
        email: values.contactPerson.email ?? '',
        avatarUrl: values.contactPerson.avatarUrl,
      }
    : null

  return (
    <View className="gap-4">
      <View className="gap-1">
        <Body className="text-sm font-medium text-foreground">Contact person *</Body>
        <SelectUser
          selectedUser={selectedContactPerson}
          placeholder="Choose contact person"
          disabled={isSubmitting}
          onPress={onOpenContactPersonPicker}
        />
        {fieldErrors.contactPerson ? (
          <Body className="text-sm text-destructive">{fieldErrors.contactPerson}</Body>
        ) : null}
      </View>

      <TextField
        label="Contact email"
        required={requireAll}
        value={values.contactEmail}
        onChangeText={(contactEmail) => onChange({ contactEmail })}
        editable={!isSubmitting}
        error={fieldErrors.contactEmail}
        placeholder="contact@company.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <PhoneInput
        label="Contact phone"
        country={values.phoneCountry}
        onCountryChange={(phoneCountry) => onChange({ phoneCountry })}
        value={values.phoneNational}
        onChangeText={(phoneNational) => onChange({ phoneNational })}
        disabled={isSubmitting}
        error={fieldErrors.contactPhone}
      />
    </View>
  )
}
