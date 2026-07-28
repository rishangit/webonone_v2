import { Button, FormField, Input } from '@webonone/ui-kit'
import {
  generateVariantSku,
  suggestVariantName,
  type ProductVariantWizardFormValues,
} from '@/features/products/schemas/productVariantSchemas'
import type { CatalogAttributeValue } from '@/shared/types/data.types'

type ProductVariantWizardStepIdentityProps = {
  values: ProductVariantWizardFormValues
  productName: string
  attributes: CatalogAttributeValue[]
  fieldErrors: Partial<Record<'name' | 'sku', string>>
  isSubmitting: boolean
  onChange: (patch: Partial<ProductVariantWizardFormValues>) => void
}

export function ProductVariantWizardStepIdentity({
  values,
  productName,
  attributes,
  fieldErrors,
  isSubmitting,
  onChange,
}: ProductVariantWizardStepIdentityProps) {
  return (
    <div className="space-y-4">
      <FormField label="Variant name" htmlFor="variant-wizard-name" required error={fieldErrors.name}>
        <div className="flex flex-wrap gap-2">
          <Input
            id="variant-wizard-name"
            value={values.name}
            onChange={(e) => onChange({ name: e.target.value })}
            disabled={isSubmitting}
            className="min-w-0 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onChange({ name: suggestVariantName(values, attributes) })}
          >
            Suggest
          </Button>
        </div>
      </FormField>

      <FormField label="SKU" htmlFor="variant-wizard-sku" required error={fieldErrors.sku}>
        <div className="flex flex-wrap gap-2">
          <Input
            id="variant-wizard-sku"
            value={values.sku}
            onChange={(e) => onChange({ sku: e.target.value })}
            disabled={isSubmitting}
            className="min-w-0 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onChange({ sku: generateVariantSku(productName) })}
          >
            Generate
          </Button>
        </div>
      </FormField>
    </div>
  )
}
