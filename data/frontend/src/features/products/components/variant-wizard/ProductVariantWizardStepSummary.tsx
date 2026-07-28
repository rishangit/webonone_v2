import { StatusTag } from '@webonone/ui-kit'
import {
  resolveWizardAttributeValues,
  type ProductVariantWizardFormValues,
} from '@/features/products/schemas/productVariantSchemas'
import type { CatalogAttributeValue } from '@/shared/types/data.types'

type ProductVariantWizardStepSummaryProps = {
  values: ProductVariantWizardFormValues
  attributes: CatalogAttributeValue[]
}

export function ProductVariantWizardStepSummary({
  values,
  attributes,
}: ProductVariantWizardStepSummaryProps) {
  const attributeRows = resolveWizardAttributeValues(values, attributes)

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-medium text-foreground">{values.name || '—'}</h3>
          <StatusTag variant={values.kind === 'default' ? 'verified' : 'pending'}>
            {values.kind === 'default' ? 'Default' : 'Custom'}
          </StatusTag>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">SKU</p>
          <p className="text-sm text-foreground">{values.sku || '—'}</p>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4">
        <h4 className="text-sm font-medium text-foreground">Attribute values</h4>
        {attributeRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attribute values on this variant.</p>
        ) : (
          <ul className="space-y-3">
            {attributeRows.map((row) => (
              <li key={row.attributeName} className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">{row.attributeName}</p>
                <p className="text-sm text-muted-foreground">{row.label}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
