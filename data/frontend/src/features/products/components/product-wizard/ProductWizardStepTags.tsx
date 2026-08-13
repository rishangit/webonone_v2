import { useTranslation } from 'react-i18next'
import { FormField, type SelectTagValue } from '@webonone/ui-kit'
import { TagSelectTrigger } from '@/features/tags/components/TagSelectField'
import type { ProductWizardFormValues } from '@/features/products/schemas/productSchemas'

interface ProductWizardStepTagsProps {
  values: ProductWizardFormValues
  isSubmitting: boolean
  disabled?: boolean
  onOpenPicker: () => void
}

export function ProductWizardStepTags({
  values,
  isSubmitting,
  disabled,
  onOpenPicker,
}: ProductWizardStepTagsProps) {
  const { t } = useTranslation('products')
  return (
    <div className="space-y-4">
      <FormField label={t('tags')} htmlFor="product-wizard-tags">
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
