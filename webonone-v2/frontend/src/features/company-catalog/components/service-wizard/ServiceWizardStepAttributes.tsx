import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import type { ServiceWizardFormValues } from '@/features/company-catalog/schemas/serviceSchemas'

export type AttributeOption = {
  id: string
  name: string
  valueType: string
}

interface ServiceWizardStepAttributesProps {
  values: ServiceWizardFormValues
  attributeOptions: AttributeOption[]
  isSubmitting: boolean
  onChange: (patch: Partial<ServiceWizardFormValues>) => void
}

export function ServiceWizardStepAttributes({
  values,
  attributeOptions,
  isSubmitting,
  onChange,
}: ServiceWizardStepAttributesProps) {
  function addAttributeRow() {
    onChange({
      attributes: [
        ...values.attributes,
        { attributeId: '', valueText: '', valueNumber: '' },
      ],
    })
  }

  function updateRow(
    index: number,
    patch: Partial<ServiceWizardFormValues['attributes'][number]>,
  ) {
    onChange({
      attributes: values.attributes.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    })
  }

  function removeRow(index: number) {
    onChange({
      attributes: values.attributes.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Attributes</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addAttributeRow}
          disabled={isSubmitting}
        >
          Add attribute
        </Button>
      </div>

      {values.attributes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Optional. Add custom attribute values for this service.
        </p>
      ) : null}

      {values.attributes.map((row, index) => {
        const attr = attributeOptions.find((a) => a.id === row.attributeId)
        return (
          <div
            key={index}
            className="grid gap-2 rounded-md border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-3 sm:grid-cols-3"
          >
            <Select
              value={row.attributeId || undefined}
              onValueChange={(attributeId) => updateRow(index, { attributeId })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Attribute" />
              </SelectTrigger>
              <SelectContent>
                {attributeOptions.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {attr?.valueType === 'number' ? (
              <Input
                type="number"
                placeholder="Value"
                value={row.valueNumber}
                onChange={(e) => updateRow(index, { valueNumber: e.target.value })}
                disabled={isSubmitting}
              />
            ) : (
              <Input
                placeholder="Value"
                value={row.valueText}
                onChange={(e) => updateRow(index, { valueText: e.target.value })}
                disabled={isSubmitting}
              />
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => removeRow(index)}
              disabled={isSubmitting}
            >
              Remove
            </Button>
          </div>
        )
      })}
    </div>
  )
}
