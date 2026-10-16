import { useTranslation } from 'react-i18next'
import {
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@webonone/ui-kit'
import type { ServiceWizardFormValues } from '@/features/services/schemas/serviceSchemas'

interface ServiceWizardStepBasicsProps {
  values: ServiceWizardFormValues
  fieldErrors: Partial<Record<keyof ServiceWizardFormValues, string>>
  isSubmitting: boolean
  canSetStatus: boolean
  onChange: (patch: Partial<ServiceWizardFormValues>) => void
}

export function ServiceWizardStepBasics({
  values,
  fieldErrors,
  isSubmitting,
  canSetStatus,
  onChange,
}: ServiceWizardStepBasicsProps) {
  const { t } = useTranslation('services')
  return (
    <div className="space-y-4">
      <FormField label={t('common:name')} htmlFor="service-wizard-name" required error={fieldErrors.name}>
        <Input
          id="service-wizard-name"
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={isSubmitting}
          className="w-full"
        />
      </FormField>

      <FormField
        label={t('common:description')}
        htmlFor="service-wizard-description"
        error={fieldErrors.description}
      >
        <Textarea
          id="service-wizard-description"
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          disabled={isSubmitting}
          rows={4}
          className="w-full resize-none"
        />
      </FormField>

      {canSetStatus ? (
        <FormField label={t('common:status')} htmlFor="service-wizard-status" required error={fieldErrors.status}>
          <Select
            value={values.status}
            onValueChange={(status) =>
              onChange({ status: status as ServiceWizardFormValues['status'] })
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id="service-wizard-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">{t('unverified')}</SelectItem>
              <SelectItem value="verified">{t('verified')}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      ) : null}
    </div>
  )
}
