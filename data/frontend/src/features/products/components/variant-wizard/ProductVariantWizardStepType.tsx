import { cn, FormField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@webonone/ui-kit'
import {
  formatAttributeValueLabel,
  multiValueAttributes,
  type ProductVariantWizardFormValues,
} from '@/features/products/schemas/productVariantSchemas'
import type { CatalogAttributeValue } from '@/shared/types/data.types'

type ProductVariantWizardStepTypeProps = {
  values: ProductVariantWizardFormValues
  attributes: CatalogAttributeValue[]
  hasDefaultVariant: boolean
  fieldErrors: Record<string, string>
  isSubmitting: boolean
  onChange: (patch: Partial<ProductVariantWizardFormValues>) => void
}

export function ProductVariantWizardStepType({
  values,
  attributes,
  hasDefaultVariant,
  fieldErrors,
  isSubmitting,
  onChange,
}: ProductVariantWizardStepTypeProps) {
  const multi = multiValueAttributes(attributes)

  return (
    <div className="space-y-6">
      <fieldset className="space-y-3" disabled={isSubmitting}>
        <legend className="text-sm font-medium text-foreground">Variant type</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={hasDefaultVariant || isSubmitting}
            aria-pressed={values.kind === 'default'}
            className={cn(
              'rounded-lg border p-4 text-left transition-colors',
              values.kind === 'default'
                ? 'border-primary bg-primary/5'
                : 'border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))]',
              (hasDefaultVariant || isSubmitting) && 'cursor-not-allowed opacity-60',
            )}
            onClick={() => onChange({ kind: 'default' })}
          >
            <p className="font-medium text-foreground">Default</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Uses each attribute&apos;s default value. One per product.
            </p>
            {hasDefaultVariant ? (
              <p className="mt-2 text-xs text-muted-foreground">
                A default variant already exists for this product.
              </p>
            ) : null}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            aria-pressed={values.kind === 'custom'}
            className={cn(
              'rounded-lg border p-4 text-left transition-colors',
              values.kind === 'custom'
                ? 'border-primary bg-primary/5'
                : 'border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))]',
            )}
            onClick={() => onChange({ kind: 'custom' })}
          >
            <p className="font-medium text-foreground">Custom</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose values from attributes that have multiple options.
            </p>
          </button>
        </div>
        {fieldErrors.kind ? (
          <p className="text-sm text-destructive">{fieldErrors.kind}</p>
        ) : null}
      </fieldset>

      {values.kind === 'custom' ? (
        <div className="space-y-4">
          {multi.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No attributes with multiple values. Add more values on the Attributes tab, or
              create a Default variant instead.
            </p>
          ) : (
            multi.map((attr) => {
              const errorKey = `selectedValueByAttributeId.${attr.attributeId}`
              const selected = values.selectedValueByAttributeId[attr.attributeId] ?? ''
              return (
                <FormField
                  key={attr.attributeId}
                  label={attr.name}
                  htmlFor={`variant-attr-${attr.attributeId}`}
                  required
                  error={fieldErrors[errorKey] ?? fieldErrors[attr.attributeId]}
                >
                  <Select
                    value={selected || undefined}
                    onValueChange={(valueId) =>
                      onChange({
                        selectedValueByAttributeId: {
                          ...values.selectedValueByAttributeId,
                          [attr.attributeId]: valueId,
                        },
                      })
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id={`variant-attr-${attr.attributeId}`} className="w-full">
                      <SelectValue placeholder="Select a value" />
                    </SelectTrigger>
                    <SelectContent>
                      {attr.values.map((value) => (
                        <SelectItem key={value.id} value={value.id}>
                          {formatAttributeValueLabel(value, attr.unit?.symbol)}
                          {value.isDefault ? ' (default)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )
            })
          )}
        </div>
      ) : null}
    </div>
  )
}
