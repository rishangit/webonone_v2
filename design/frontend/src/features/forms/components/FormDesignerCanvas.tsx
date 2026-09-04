import { Edit3 } from 'lucide-react'
import {
  Button,
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
import { useTranslation } from 'react-i18next'
import type { FormField } from '@/shared/types/design.types'

interface FormDesignerCanvasProps {
  fields: FormField[]
  selectedId: string | null
  canEdit?: boolean
  onSelect: (id: string) => void
  onEdit: (id: string) => void
}

function FieldPreview({ field }: { field: FormField }) {
  const { t } = useTranslation('forms')
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
          <Input disabled placeholder={field.placeholder || t('placeholderText')} />
        </div>
      )
    case 'textarea':
      return (
        <div>
          {label}
          <Textarea disabled placeholder={field.placeholder || t('placeholderLong')} rows={3} />
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
              <SelectValue placeholder={field.placeholder || t('selectPlaceholder')} />
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

export function FormDesignerCanvas({ fields, selectedId, canEdit, onSelect, onEdit }: FormDesignerCanvasProps) {
  const { t } = useTranslation('forms')

  if (fields.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-[hsl(var(--glass-border))] p-6 text-center text-sm text-muted-foreground">
        {t('canvasEmpty')}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => {
        const selected = selectedId === field.id

        return (
          <div
            key={field.id}
            role={canEdit ? 'button' : undefined}
            tabIndex={canEdit ? 0 : undefined}
            onClick={canEdit ? () => onSelect(field.id) : undefined}
            onKeyDown={
              canEdit
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect(field.id)
                    }
                  }
                : undefined
            }
            className={cn(
              'relative w-full rounded-lg border p-4 text-left',
              'border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg)/0.4)]',
              canEdit && 'cursor-pointer',
              selected && 'ring-2 ring-ring',
              selected && canEdit && 'pr-14',
            )}
          >
            {canEdit && selected ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute right-2 top-2 h-9 w-9 shrink-0 rounded-full"
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit(field.id)
                }}
                aria-label={t('editField', { name: field.label })}
              >
                <Edit3 className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
            <FieldPreview field={field} />
          </div>
        )
      })}
    </div>
  )
}
