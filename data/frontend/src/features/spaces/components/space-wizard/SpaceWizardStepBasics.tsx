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
import type { SpaceWizardFormValues } from '@/features/spaces/schemas/spaceSchemas'

interface SpaceWizardStepBasicsProps {
  values: SpaceWizardFormValues
  fieldErrors: Partial<Record<keyof SpaceWizardFormValues, string>>
  isSubmitting: boolean
  canSetStatus: boolean
  onChange: (patch: Partial<SpaceWizardFormValues>) => void
}

export function SpaceWizardStepBasics({
  values,
  fieldErrors,
  isSubmitting,
  canSetStatus,
  onChange,
}: SpaceWizardStepBasicsProps) {
  const { t } = useTranslation('spaces')
  return (
    <div className="space-y-4">
      <FormField label={t('common:name')} htmlFor="space-wizard-name" required error={fieldErrors.name}>
        <Input
          id="space-wizard-name"
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={isSubmitting}
          className="w-full"
        />
      </FormField>

      <FormField
        label={t('common:description')}
        htmlFor="space-wizard-description"
        error={fieldErrors.description}
      >
        <Textarea
          id="space-wizard-description"
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          disabled={isSubmitting}
          rows={4}
          className="w-full resize-none"
        />
      </FormField>

      {canSetStatus ? (
        <FormField
          label={t('common:status')}
          htmlFor="space-wizard-status"
          required
          error={fieldErrors.status}
        >
          <Select
            value={values.status}
            onValueChange={(status) =>
              onChange({ status: status as SpaceWizardFormValues['status'] })
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id="space-wizard-status" className="w-full">
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
