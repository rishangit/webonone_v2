import {
  Checkbox,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from '@webonone/ui-kit'
import type { FormField } from '@/shared/types/design.types'

interface FormDesignerCanvasProps {
  fields: FormField[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function FieldPreview({ field }: { field: FormField }) {
  const label = (
    <Label className="mb-1.5 block">
      {field.label}
      {field.required ? <span className="text-destructive"> *</span> : null}
    </Label>
  )

  switch (field.type) {
    case 'text':
      return (
        <div>
          {label}
          <Input disabled placeholder={field.placeholder || 'Text input'} />
        </div>
      )
    case 'textarea':
      return (
        <div>
          {label}
          <Textarea disabled placeholder={field.placeholder || 'Long text'} rows={3} />
        </div>
      )
    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <Checkbox disabled id={`preview-${field.id}`} />
          <Label htmlFor={`preview-${field.id}`}>
            {field.label}
            {field.required ? <span className="text-destructive"> *</span> : null}
          </Label>
        </div>
      )
    case 'radio':
      return (
        <div>
          {label}
          <RadioGroup disabled className="gap-2">
            {(field.options ?? []).map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <RadioGroupItem value={opt.id} id={`${field.id}-${opt.id}`} disabled />
                <Label htmlFor={`${field.id}-${opt.id}`}>{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )
    case 'select':
      return (
        <div>
          {label}
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select…'} />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    default:
      return null
  }
}

export function FormDesignerCanvas({ fields, selectedId, onSelect }: FormDesignerCanvasProps) {
  if (fields.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-[hsl(var(--glass-border))] p-6 text-center text-sm text-muted-foreground">
        Click a toolbox control to add fields to this form.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <button
          key={field.id}
          type="button"
          onClick={() => onSelect(field.id)}
          className={cn(
            'w-full rounded-lg border p-4 text-left transition-shadow',
            'border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg)/0.4)]',
            selectedId === field.id && 'ring-2 ring-ring',
          )}
        >
          <FieldPreview field={field} />
        </button>
      ))}
    </div>
  )
}
