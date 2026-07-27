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
  return (
    <div className="space-y-4">
      <FormField label="Tags" htmlFor="product-wizard-tags">
        <TagSelectTrigger
          selectedTags={values.tags as SelectTagValue[]}
          onOpen={onOpenPicker}
          disabled={disabled || isSubmitting}
        />
      </FormField>
      <p className="text-sm text-muted-foreground">
        Optional. Select one or more tags to label this product.
      </p>
    </div>
  )
}
