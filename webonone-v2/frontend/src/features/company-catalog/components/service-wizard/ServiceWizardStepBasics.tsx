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
import type { ServiceWizardFormValues } from '@/features/company-catalog/schemas/serviceSchemas'

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
  return (
    <div className="space-y-4">
      <FormField label="Name" htmlFor="company-service-wizard-name" required error={fieldErrors.name}>
        <Input
          id="company-service-wizard-name"
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={isSubmitting}
          className="w-full"
        />
      </FormField>

      <FormField
        label="Description"
        htmlFor="company-service-wizard-description"
        error={fieldErrors.description}
      >
        <Textarea
          id="company-service-wizard-description"
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          disabled={isSubmitting}
          rows={4}
          className="w-full resize-none"
        />
      </FormField>

      {canSetStatus ? (
        <FormField
          label="Status"
          htmlFor="company-service-wizard-status"
          required
          error={fieldErrors.status}
        >
          <Select
            value={values.status}
            onValueChange={(status) =>
              onChange({ status: status as ServiceWizardFormValues['status'] })
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id="company-service-wizard-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Unverified</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      ) : null}

      <FormField label="List price (LKR)" htmlFor="company-service-wizard-list-price">
        <Input
          id="company-service-wizard-list-price"
          type="number"
          min={0}
          step="0.01"
          value={values.listPrice}
          onChange={(e) => onChange({ listPrice: e.target.value })}
          disabled={isSubmitting}
          className="w-full"
        />
      </FormField>
    </div>
  )
}
