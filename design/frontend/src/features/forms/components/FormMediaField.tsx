import { useState } from 'react'
import { FileText, Paperclip, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, FormField } from '@webonone/ui-kit'
import { FormMediaPickerDialog } from '@/features/forms/components/FormMediaPickerDialog'
import type { FormField as FormFieldDef, FormMediaFileRef } from '@/shared/types/design.types'

function isMediaRef(value: unknown): value is FormMediaFileRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    'fileId' in value &&
    typeof (value as FormMediaFileRef).fileId === 'string'
  )
}

function readMediaValue(
  value: unknown,
  allowMultiple: boolean,
): FormMediaFileRef[] {
  if (allowMultiple) {
    if (!Array.isArray(value)) return []
    return value.filter(isMediaRef)
  }
  return isMediaRef(value) ? [value] : []
}

interface FormMediaFieldProps {
  field: FormFieldDef
  value: unknown
  error?: string
  disabled?: boolean
  onChange: (value: unknown) => void
}

export function FormMediaField({ field, value, error, disabled, onChange }: FormMediaFieldProps) {
  const { t } = useTranslation('forms')
  const allowMultiple = Boolean(field.allowMultiple)
  const files = readMediaValue(value, allowMultiple)
  const [pickerOpen, setPickerOpen] = useState(false)

  function removeAt(index: number) {
    if (allowMultiple) {
      const next = files.filter((_, i) => i !== index)
      onChange(next)
      return
    }
    onChange(null)
  }

  function handlePicked(items: FormMediaFileRef[]) {
    if (allowMultiple) {
      const merged = [...files]
      for (const item of items) {
        if (!merged.some((f) => f.fileId === item.fileId)) merged.push(item)
      }
      onChange(merged)
      return
    }
    onChange(items[0] ?? null)
  }

  return (
    <>
      <FormField htmlFor={field.id} label={field.label} required={field.required} error={error}>
        <div className="space-y-2">
          {files.length > 0 ? (
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.fileId}-${index}`}
                  className="flex items-center gap-2 rounded-md border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg)/0.4)] px-3 py-2"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-sm text-primary underline-offset-2 hover:underline"
                  >
                    {file.fileName?.trim() || file.fileId}
                  </a>
                  {!disabled ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label={t('removeAttachment')}
                      onClick={() => removeAt(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t('noAttachments')}</p>
          )}
          {!disabled ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2"
              onClick={() => setPickerOpen(true)}
            >
              <Paperclip className="h-4 w-4" aria-hidden />
              {allowMultiple ? t('addDocuments') : t('addDocument')}
            </Button>
          ) : null}
        </div>
      </FormField>
      {!disabled ? (
        <FormMediaPickerDialog
          open={pickerOpen}
          allowMultiple={allowMultiple}
          onClose={() => setPickerOpen(false)}
          onSelect={handlePicked}
        />
      ) : null}
    </>
  )
}

export function initialMediaAnswer(field: FormFieldDef): unknown {
  if (field.type !== 'media') return ''
  return field.allowMultiple ? [] : null
}

export function isMediaAnswerEmpty(field: FormFieldDef, value: unknown): boolean {
  if (field.type !== 'media') return value == null || value === ''
  if (field.allowMultiple) {
    return !Array.isArray(value) || value.length === 0
  }
  return !isMediaRef(value)
}
