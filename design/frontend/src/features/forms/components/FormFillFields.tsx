import { useTranslation } from 'react-i18next'
import {
  Checkbox,
  FormField,
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
} from '@webonone/ui-kit'
import {
  FormMediaField,
  initialMediaAnswer,
  isMediaAnswerEmpty,
} from '@/features/forms/components/FormMediaField'
import type { FormField as FormFieldDef } from '@/shared/types/design.types'

export function buildInitialFormAnswers(fields: FormFieldDef[]): Record<string, unknown> {
  const initial: Record<string, unknown> = {}
  for (const field of fields) {
    if (field.type === 'checkbox') initial[field.id] = false
    else if (field.type === 'media') initial[field.id] = initialMediaAnswer(field)
    else initial[field.id] = ''
  }
  return initial
}

export function validateFormAnswers(
  fields: FormFieldDef[],
  answers: Record<string, unknown>,
  t: (key: string, opts?: Record<string, string>) => string,
): Record<string, string> {
  const next: Record<string, string> = {}
  for (const field of fields) {
    const value = answers[field.id]
    if (!field.required) continue
    if (field.type === 'checkbox') continue
    if (field.type === 'media') {
      if (isMediaAnswerEmpty(field, value)) {
        next[field.id] = t('fieldRequired', { label: field.label })
      }
      continue
    }
    if (value == null || value === '') {
      next[field.id] = t('fieldRequired', { label: field.label })
    }
  }
  return next
}

interface FormFillFieldsProps {
  fields: FormFieldDef[]
  answers: Record<string, unknown>
  fieldErrors: Record<string, string>
  disabled: boolean
  onAnswer: (fieldId: string, value: unknown) => void
}

export function FormFillFields({
  fields,
  answers,
  fieldErrors,
  disabled,
  onAnswer,
}: FormFillFieldsProps) {
  const { t } = useTranslation('forms')

  return (
    <div className="flex flex-col gap-6">
      {fields.map((field) => {
        if (field.type === 'media') {
          return (
            <FormMediaField
              key={field.id}
              field={field}
              value={answers[field.id]}
              error={fieldErrors[field.id]}
              disabled={disabled}
              onChange={(value) => onAnswer(field.id, value)}
            />
          )
        }

        if (field.type === 'checkbox') {
          return (
            <div key={field.id} className="flex items-start gap-3">
              <Checkbox
                id={field.id}
                checked={Boolean(answers[field.id])}
                disabled={disabled}
                onCheckedChange={(checked) => onAnswer(field.id, checked === true)}
              />
              <Label htmlFor={field.id} className="font-normal leading-snug">
                {field.label}
                {field.required ? <span className="text-destructive"> *</span> : null}
              </Label>
            </div>
          )
        }

        if (field.type === 'textarea') {
          return (
            <FormField
              key={field.id}
              htmlFor={field.id}
              label={field.label}
              required={field.required}
              error={fieldErrors[field.id]}
            >
              <Textarea
                value={String(answers[field.id] ?? '')}
                placeholder={field.placeholder}
                disabled={disabled}
                onChange={(e) => onAnswer(field.id, e.target.value)}
              />
            </FormField>
          )
        }

        if (field.type === 'select') {
          return (
            <FormField
              key={field.id}
              htmlFor={field.id}
              label={field.label}
              required={field.required}
              error={fieldErrors[field.id]}
            >
              <Select
                value={String(answers[field.id] ?? '') || undefined}
                onValueChange={(value) => onAnswer(field.id, value)}
                disabled={disabled}
              >
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
            </FormField>
          )
        }

        if (field.type === 'radio') {
          return (
            <div key={field.id} className="space-y-2">
              <Label>
                {field.label}
                {field.required ? <span className="text-destructive"> *</span> : null}
              </Label>
              <RadioGroup
                value={String(answers[field.id] ?? '') || undefined}
                onValueChange={(value) => onAnswer(field.id, value)}
                disabled={disabled}
                className="gap-2"
              >
                {(field.options ?? []).map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.id} id={`${field.id}-${opt.id}`} disabled={disabled} />
                    <Label htmlFor={`${field.id}-${opt.id}`} className="font-normal">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {fieldErrors[field.id] ? (
                <p className="text-sm text-destructive">{fieldErrors[field.id]}</p>
              ) : null}
            </div>
          )
        }

        return (
          <FormField
            key={field.id}
            htmlFor={field.id}
            label={field.label}
            required={field.required}
            error={fieldErrors[field.id]}
          >
            <Input
              value={String(answers[field.id] ?? '')}
              placeholder={field.placeholder}
              disabled={disabled}
              onChange={(e) => onAnswer(field.id, e.target.value)}
            />
          </FormField>
        )
      })}

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noFields')}</p>
      ) : null}
    </div>
  )
}
