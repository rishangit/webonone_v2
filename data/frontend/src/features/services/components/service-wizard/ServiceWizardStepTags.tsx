import { FormField, type SelectTagValue } from '@webonone/ui-kit'
import { TagSelectTrigger } from '@/features/tags/components/TagSelectField'
import type { ServiceWizardFormValues } from '@/features/services/schemas/serviceSchemas'

interface ServiceWizardStepTagsProps {
  values: ServiceWizardFormValues
  isSubmitting: boolean
  disabled?: boolean
  onOpenPicker: () => void
}

export function ServiceWizardStepTags({
  values,
  isSubmitting,
  disabled,
  onOpenPicker,
}: ServiceWizardStepTagsProps) {
  return (
    <div className="space-y-4">
      <FormField label="Tags" htmlFor="service-wizard-tags">
        <TagSelectTrigger
          selectedTags={values.tags as SelectTagValue[]}
          onOpen={onOpenPicker}
          disabled={disabled || isSubmitting}
        />
      </FormField>
      <p className="text-sm text-muted-foreground">
        Optional. Select one or more tags to label this service.
      </p>
    </div>
  )
}
