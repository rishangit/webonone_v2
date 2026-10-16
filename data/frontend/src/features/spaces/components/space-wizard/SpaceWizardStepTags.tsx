import { useTranslation } from 'react-i18next'
import { FormField, type SelectTagValue } from '@webonone/ui-kit'
import { TagSelectTrigger } from '@/features/tags/components/TagSelectField'
import type { SpaceWizardFormValues } from '@/features/spaces/schemas/spaceSchemas'

interface SpaceWizardStepTagsProps {
  values: SpaceWizardFormValues
  isSubmitting: boolean
  disabled?: boolean
  onOpenPicker: () => void
}

export function SpaceWizardStepTags({
  values,
  isSubmitting,
  disabled,
  onOpenPicker,
}: SpaceWizardStepTagsProps) {
  const { t } = useTranslation('spaces')
  return (
    <div className="space-y-4">
      <FormField label={t('tags')} htmlFor="space-wizard-tags">
        <TagSelectTrigger
          selectedTags={values.tags as SelectTagValue[]}
          onOpen={onOpenPicker}
          disabled={disabled || isSubmitting}
        />
      </FormField>
      <p className="text-sm text-muted-foreground">{t('wizard.tagsHint')}</p>
    </div>
  )
}
