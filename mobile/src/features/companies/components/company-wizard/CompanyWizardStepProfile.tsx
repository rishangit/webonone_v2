import { View } from 'react-native'
import { NativeSelect, TextField, Textarea } from '@webonone/mobile-ui'
import {
  COMPANY_SIZE_OPTIONS,
  type CompanyWizardFormValues,
} from '@/features/companies/schemas/companySchemas'

export function CompanyWizardStepProfile({
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
        label="Company name"
        required
        value={values.name}
        onChangeText={(name) => onChange({ name })}
        editable={!isSubmitting}
        error={fieldErrors.name}
        placeholder="Your company name"
      />

      <Textarea
        label="Description"
        required={requireAll}
        value={values.description}
        onChangeText={(description) => onChange({ description })}
        editable={!isSubmitting}
        error={fieldErrors.description}
        placeholder={
          requireAll
            ? 'What does your company do?'
            : 'What does your company do? (optional — you can finish this later)'
        }
      />

      <NativeSelect
        label="Company size"
        required={requireAll}
        value={values.companySize}
        onValueChange={(companySize) =>
          onChange({ companySize: companySize as CompanyWizardFormValues['companySize'] })
        }
        placeholder={requireAll ? 'Select company size' : 'Select company size (optional)'}
        allowEmpty={!requireAll}
        options={COMPANY_SIZE_OPTIONS.map((size) => ({
          value: size,
          label: `${size} employees`,
        }))}
        error={fieldErrors.companySize}
        disabled={isSubmitting}
      />
    </View>
  )
}
