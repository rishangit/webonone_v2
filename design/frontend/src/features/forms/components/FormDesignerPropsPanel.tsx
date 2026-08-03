import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button, Checkbox, FormField, Input, Label } from '@webonone/ui-kit'
import { nanoid } from 'nanoid'
import type { FormField as FormFieldModel } from '@/shared/types/design.types'

interface FormDesignerPropsPanelProps {
  field: FormFieldModel | null
  fieldIndex: number
  fieldCount: number
  onChange: (field: FormFieldModel) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

export function FormDesignerPropsPanel({
  field,
  fieldIndex,
  fieldCount,
  onChange,
  onRemove,
  onMove,
}: FormDesignerPropsPanelProps) {
  if (!field) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">Field properties</p>
        <p className="text-xs text-muted-foreground">Select a field on the canvas to edit it.</p>
      </div>
    )
  }

  const needsOptions = field.type === 'radio' || field.type === 'select'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Field properties</p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={fieldIndex <= 0}
            onClick={() => onMove(-1)}
            aria-label="Move field up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={fieldIndex >= fieldCount - 1}
            onClick={() => onMove(1)}
            aria-label="Move field down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={onRemove}
            aria-label="Remove field"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs uppercase tracking-wide text-muted-foreground">{field.type}</p>

      <FormField label="Label" htmlFor="field-label" required>
        <Input
          id="field-label"
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
        />
      </FormField>

      {field.type !== 'checkbox' ? (
        <FormField label="Placeholder" htmlFor="field-placeholder">
          <Input
            id="field-placeholder"
            value={field.placeholder ?? ''}
            onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
          />
        </FormField>
      ) : null}

      <div className="flex items-center gap-2">
        <Checkbox
          id="field-required"
          checked={Boolean(field.required)}
          onCheckedChange={(checked) => onChange({ ...field, required: checked === true })}
        />
        <Label htmlFor="field-required">Required</Label>
      </div>

      {needsOptions ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Options</p>
          {(field.options ?? []).map((opt, index) => (
            <div key={opt.id} className="flex gap-2">
              <Input
                value={opt.label}
                onChange={(e) => {
                  const options = [...(field.options ?? [])]
                  options[index] = { ...opt, label: e.target.value }
                  onChange({ ...field, options })
                }}
                aria-label={`Option ${index + 1}`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                disabled={(field.options?.length ?? 0) <= 1}
                onClick={() => {
                  const options = (field.options ?? []).filter((o) => o.id !== opt.id)
                  onChange({ ...field, options })
                }}
                aria-label={`Remove option ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => {
              const options = [
                ...(field.options ?? []),
                { id: nanoid(8), label: `Option ${(field.options?.length ?? 0) + 1}` },
              ]
              onChange({ ...field, options })
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add option
          </Button>
        </div>
      ) : null}
    </div>
  )
}
