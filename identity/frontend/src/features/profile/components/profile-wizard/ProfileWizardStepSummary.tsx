import { useTranslation } from 'react-i18next'
import type { ProfileFormValues } from '../../schemas/profileSchemas'
import { formatCountryName } from '../../utils/formatCountryName'

interface ProfileWizardStepSummaryProps {
  values: ProfileFormValues
  phoneDisplay: string
  email: string
  avatarUrl: string | null
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground sm:text-right">{value || '—'}</dd>
    </div>
  )
}

export function ProfileWizardStepSummary({
  values,
  phoneDisplay,
  email,
  avatarUrl,
}: ProfileWizardStepSummaryProps) {
  const { t } = useTranslation('profile')
  const { t: tc } = useTranslation('common')
  const localeLabel =
    values.locale === 'si' ? tc('sinhala') : values.locale === 'en' ? tc('english') : ''

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4">
        <div className="min-w-0 space-y-1">
          <h3 className="text-lg font-medium text-foreground">{values.displayName || '—'}</h3>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>

        <dl className="space-y-3 border-t border-[hsl(var(--glass-border))] pt-4">
          <SummaryRow label={t('fields.firstName')} value={values.firstName} />
          <SummaryRow label={t('fields.lastName')} value={values.lastName} />
          <SummaryRow label={t('fields.phone')} value={phoneDisplay} />
          <SummaryRow label={t('fields.locale')} value={localeLabel} />
          <SummaryRow
            label={t('fields.address')}
            value={[values.addressLine1, values.city, formatCountryName(values.country)]
              .filter(Boolean)
              .join(', ')}
          />
          <SummaryRow
            label={t('fields.photo')}
            value={avatarUrl ? t('wizard.photoUpdated') : t('wizard.photoUnchanged')}
          />
        </dl>
      </div>

      <p className="text-center text-sm text-muted-foreground">{t('wizard.reviewHint')}</p>
    </div>
  )
}
