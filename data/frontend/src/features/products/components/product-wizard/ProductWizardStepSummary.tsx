import { useTranslation } from 'react-i18next'
import { TagChip } from '@webonone/ui-kit'
import type { ProductWizardFormValues } from '@/features/products/schemas/productSchemas'
import { StatusBadge } from '@/shared/components/StatusBadge'

interface ProductWizardStepSummaryProps {
  values: ProductWizardFormValues
  showStatus: boolean
}

export function ProductWizardStepSummary({
  values,
  showStatus,
}: ProductWizardStepSummaryProps) {
  const { t } = useTranslation('products')
  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-medium text-foreground">{values.name || t('noDescription')}</h3>
            {showStatus ? <StatusBadge status={values.status} /> : null}
          </div>
          {values.description.trim() ? (
            <p className="text-sm text-muted-foreground">{values.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{t('wizard.noDescription')}</p>
          )}
        </div>

        <div className="space-y-2 border-t border-[hsl(var(--glass-border))] pt-4">
          <p className="text-xs font-medium text-muted-foreground">{t('tags')}</p>
          {values.tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('wizard.noTags')}</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {values.tags.map((tag) => (
                <TagChip key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4">
        <h4 className="text-sm font-medium text-foreground">{t('attributes')}</h4>
        {values.attributes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('wizard.noAttributes')}</p>
        ) : (
          <ul className="space-y-3">
            {values.attributes.map((row) => (
              <li key={row.attributeId} className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {row.name || row.attributeId}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="capitalize">{row.valueType}</span>
                  {row.unit ? ` · ${row.unit.name} (${row.unit.symbol})` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
