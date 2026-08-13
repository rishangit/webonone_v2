import { useTranslation } from 'react-i18next'
import type { ServiceWizardFormValues } from '@/features/services/schemas/serviceSchemas'

type AttributeOption = {
  id: string
  name: string
  valueType: string
}

interface ServiceWizardStepSummaryProps {
  values: ServiceWizardFormValues
  attributeOptions: AttributeOption[]
  showStatus: boolean
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground sm:text-right">{value || '—'}</dd>
    </div>
  )
}

function formatAttributeValue(
  row: ServiceWizardFormValues['attributes'][number],
  attr: AttributeOption | undefined,
): string {
  if (attr?.valueType === 'number') {
    return row.valueNumber.trim() || '—'
  }
  return row.valueText.trim() || '—'
}

export function ServiceWizardStepSummary({
  values,
  attributeOptions,
  showStatus,
}: ServiceWizardStepSummaryProps) {
  const { t } = useTranslation('services')
  const timeSummary =
    values.time_mode === 'duration'
      ? values.duration_minutes.trim()
        ? t('durationValue', { count: Number(values.duration_minutes) || 0 })
        : t('noDescription')
      : `${values.start_time || t('noDescription')} – ${values.end_time || t('noDescription')}`

  const attributeRows = values.attributes.filter((row) => row.attributeId)

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4">
        <div className="min-w-0 space-y-1">
          <h3 className="text-lg font-medium text-foreground">{values.name || t('noDescription')}</h3>
          {values.description.trim() ? (
            <p className="text-sm text-muted-foreground">{values.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{t('wizard.noDescription')}</p>
          )}
        </div>

        <dl className="space-y-3 border-t border-[hsl(var(--glass-border))] pt-4">
          {showStatus ? (
            <SummaryRow
              label={t('common:status')}
              value={values.status === 'verified' ? t('verified') : t('unverified')}
            />
          ) : null}
          <SummaryRow
            label={t('timeMode')}
            value={values.time_mode === 'window' ? t('timeModeWindow') : t('timeModeDuration')}
          />
          <SummaryRow label={t('time')} value={timeSummary} />
          <SummaryRow
            label={t('tags')}
            value={
              values.tags.length > 0
                ? values.tags.map((tag) => tag.name).join(', ')
                : ''
            }
          />
        </dl>
      </div>

      <div className="space-y-3 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4">
        <h4 className="text-sm font-medium text-foreground">{t('attributes')}</h4>
        {attributeRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('wizard.noAttributes')}</p>
        ) : (
          <dl className="space-y-3">
            {attributeRows.map((row) => {
              const attr = attributeOptions.find((a) => a.id === row.attributeId)
              return (
                <SummaryRow
                  key={row.attributeId}
                  label={attr?.name ?? row.attributeId}
                  value={formatAttributeValue(row, attr)}
                />
              )
            })}
          </dl>
        )}
      </div>
    </div>
  )
}
