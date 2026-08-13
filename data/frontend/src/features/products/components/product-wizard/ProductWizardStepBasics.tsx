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
import type { ProductWizardFormValues } from '@/features/products/schemas/productSchemas'

interface ProductWizardStepBasicsProps {
  values: ProductWizardFormValues
  fieldErrors: Partial<Record<keyof ProductWizardFormValues, string>>
  isSubmitting: boolean
  canSetStatus: boolean
  onChange: (patch: Partial<ProductWizardFormValues>) => void
}

export function ProductWizardStepBasics({
  values,
  fieldErrors,
  isSubmitting,
  canSetStatus,
  onChange,
}: ProductWizardStepBasicsProps) {
  const { t } = useTranslation('products')
  return (
    <div className="space-y-4">
      <FormField label={t('common:name')} htmlFor="product-wizard-name" required error={fieldErrors.name}>
        <Input
          id="product-wizard-name"
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={isSubmitting}
          className="w-full"
        />
      </FormField>

      <FormField
        label={t('common:description')}
        htmlFor="product-wizard-description"
        error={fieldErrors.description}
      >
        <Textarea
          id="product-wizard-description"
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
          htmlFor="product-wizard-status"
          required
          error={fieldErrors.status}
        >
          <Select
            value={values.status}
            onValueChange={(status) =>
              onChange({ status: status as ProductWizardFormValues['status'] })
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id="product-wizard-status" className="w-full">
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
