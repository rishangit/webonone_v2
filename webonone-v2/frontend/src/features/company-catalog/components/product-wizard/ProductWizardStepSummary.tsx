import { CatalogEditedLabel } from '@/features/company-catalog/components/CatalogEditedLabel'
import type { ProductWizardFormValues } from '@/features/company-catalog/schemas/productSchemas'
import type { CatalogEditedField } from '@/features/company-catalog/utils/catalogLibraryEdits'
import type { AttributeOption } from '@/features/company-catalog/components/service-wizard/ServiceWizardStepAttributes'

interface ProductWizardStepSummaryProps {
  values: ProductWizardFormValues
  attributeOptions: AttributeOption[]
  showStatus: boolean
  editedFields?: Set<CatalogEditedField>
}

function SummaryRow({
  label,
  value,
  edited,
}: {
  label: string
  value: string
  edited?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {label}
        <CatalogEditedLabel show={Boolean(edited)} />
      </dt>
      <dd className="text-sm font-medium text-foreground sm:text-right">{value || '—'}</dd>
    </div>
  )
}

function formatAttributeValue(
  row: ProductWizardFormValues['attributes'][number],
  attr: AttributeOption | undefined,
): string {
  if (attr?.valueType === 'number') {
    return row.valueNumber.trim() || '—'
  }
  return row.valueText.trim() || '—'
}

export function ProductWizardStepSummary({
  values,
  attributeOptions,
  showStatus,
  editedFields,
}: ProductWizardStepSummaryProps) {
  const attributeRows = values.attributes.filter((row) => row.attributeId)

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4">
        <div className="min-w-0 space-y-1">
          <h3 className="text-lg font-medium text-foreground">{values.name || '—'}</h3>
          {values.description.trim() ? (
            <p className="text-sm text-muted-foreground">{values.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No description</p>
          )}
        </div>

        <dl className="space-y-3 border-t border-[hsl(var(--glass-border))] pt-4">
          {showStatus ? (
            <SummaryRow
              label="Status"
              value={values.status === 'verified' ? 'Verified' : 'Unverified'}
            />
          ) : null}
          <SummaryRow
            label="Tags"
            value={
              values.tags.length > 0 ? values.tags.map((tag) => tag.name).join(', ') : ''
            }
            edited={editedFields?.has('tags')}
          />
        </dl>
      </div>

      <div className="space-y-3 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4">
        <h4 className="text-sm font-medium text-foreground">Attributes</h4>
        {attributeRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attributes</p>
        ) : (
          <dl className="space-y-3">
            {attributeRows.map((row) => {
              const attr = attributeOptions.find((a) => a.id === row.attributeId)
              return (
                <SummaryRow
                  key={row.attributeId}
                  label={attr?.name ?? row.attributeId}
                  value={formatAttributeValue(row, attr)}
                  edited={editedFields?.has('attributes')}
                />
              )
            })}
          </dl>
        )}
      </div>
    </div>
  )
}
