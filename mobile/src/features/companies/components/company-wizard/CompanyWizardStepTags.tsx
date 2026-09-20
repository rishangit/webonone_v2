import { useState } from 'react'
import { View } from 'react-native'
import { Muted, SelectTag } from '@webonone/mobile-ui'
import type { CompanyWizardFormValues } from '@/features/companies/schemas/companySchemas'
import { CompanyTagMultiSelectionDialog } from '@/features/companies/components/company-wizard/CompanyTagMultiSelectionDialog'

export function CompanyWizardStepTags({
  values,
  isSubmitting,
  onChange,
}: {
  values: CompanyWizardFormValues
  isSubmitting: boolean
  onChange: (patch: Partial<CompanyWizardFormValues>) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <View className="gap-4">
      <Muted>
        Associate catalog tags with this company. You can skip this step and add tags later.
      </Muted>
      <SelectTag
        multiple
        selectedTags={values.tags}
        placeholder="Choose tags"
        disabled={isSubmitting}
        onPress={() => setPickerOpen(true)}
      />
      <CompanyTagMultiSelectionDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedTags={values.tags}
        onDone={(tags) => onChange({ tags })}
      />
    </View>
  )
}
