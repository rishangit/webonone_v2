import { Button, FormField, ImagePreview, Input } from '@webonone/ui-kit'
import type { MediaRef } from '../types'

function mediaRefFromData(value: unknown): MediaRef | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const url = typeof record.url === 'string' ? record.url : null
  const fileId = typeof record.fileId === 'string' ? record.fileId : null
  if (!url || !fileId) return null
  return {
    fileId,
    url,
    fileName: typeof record.fileName === 'string' ? record.fileName : undefined,
    mimeType: typeof record.mimeType === 'string' ? record.mimeType : undefined,
  }
}

export function ManualTemplateField({
  id,
  label,
  fieldKind,
  value,
  onChange,
  onPickImage,
  pickImageLabel,
}: {
  id: string
  label: string
  fieldKind: 'text' | 'media' | 'images'
  value: unknown
  onChange: (value: unknown) => void
  onPickImage?: (multi: boolean) => void
  pickImageLabel: string
}) {
  if (fieldKind === 'text') {
    return (
      <FormField label={label} htmlFor={id}>
        <Input
          id={id}
          value={typeof value === 'string' ? value : value != null ? String(value) : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      </FormField>
    )
  }

  const media = mediaRefFromData(value)
  return (
    <FormField label={label} htmlFor={id}>
      <div className="flex items-center gap-2">
        <ImagePreview
          src={media?.url ?? null}
          alt={label}
          mode="view"
          className="h-12 w-16 shrink-0 rounded-md"
        />
        <Button
          type="button"
          variant="outline"
          className="h-9"
          onClick={() => onPickImage?.(fieldKind === 'images')}
        >
          {pickImageLabel}
        </Button>
      </div>
    </FormField>
  )
}
