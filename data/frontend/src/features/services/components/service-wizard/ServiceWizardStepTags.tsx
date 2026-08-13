import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('services')
  return (
    <div className="space-y-4">
      <FormField label={t('tags')} htmlFor="service-wizard-tags">
        <TagSelectTrigger
          selectedTags={values.tags as SelectTagValue[]}
          onOpen={onOpenPicker}
          disabled={disabled || isSubmitting}
        />
      </FormField>
      <p className="text-sm text-muted-foreground">
        {t('wizard.tagsHint')}
      </p>
    </div>
  )
}
