import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  ColorInput,
  CustomDialog,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Textarea,
} from '@webonone/ui-kit'
import { tagFormSchema, type TagFormValues } from '@/features/tags/schemas/tagSchemas'
import { tagsActions } from '@/features/tags/store'
import { useEpicCatalogEditor } from '@/shared/hooks/useEpicCatalogEditor'
import type { Tag } from '@/shared/types/data.types'

const defaultValues: TagFormValues = {
  name: '',
  description: '',
  color: '#3366FF',
  status: 'pending',
}

interface TagFormDialogProps {
  open: boolean
  id?: string
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function TagFormDialog({ open, id, onOpenChange, onSaved }: TagFormDialogProps) {
  const isNew = !id
  const [values, setValues] = useState<TagFormValues>(defaultValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const submittedRef = useRef(false)

  const editor = useEpicCatalogEditor<Tag>(id, isNew, (s) => s.tags, tagsActions)

  useEffect(() => {
    if (!editor.detail || isNew) return
    const tag = editor.detail
    setValues({
      name: tag.name,
      description: tag.description ?? '',
      color: tag.color,
      status: tag.status,
    })
  }, [editor.detail, isNew])

  useEffect(() => {
    if (!submittedRef.current || editor.saving) return
    submittedRef.current = false
    if (!editor.error) onSaved()
  }, [editor.saving, editor.error, onSaved])

  function updateField<K extends keyof TagFormValues>(key: K, value: TagFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const parsed = tagFormSchema.safeParse(values)
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === 'string') errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    submittedRef.current = true
    editor.save({
      name: parsed.data.name,
      description: parsed.data.description || null,
      color: parsed.data.color,
      status: parsed.data.status,
    })
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isNew ? 'Create tag' : 'Edit tag'}
      sizeWidth="small"
      sizeHeight="auto"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={editor.saving}>
            Cancel
          </Button>
          <Button type="submit" form="tag-form" disabled={editor.saving || editor.loading}>
            {editor.saving ? 'Saving…' : isNew ? 'Create tag' : 'Save changes'}
          </Button>
        </>
      }
    >
      {editor.loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <form id="tag-form" className="space-y-4" onSubmit={handleSubmit}>
          {editor.error ? (
            <Alert variant="destructive">
              <AlertDescription>{editor.error}</AlertDescription>
            </Alert>
          ) : null}

          <FormField label="Name" htmlFor="tag-name" required error={fieldErrors.name}>
            <Input id="tag-name" value={values.name} onChange={(e) => updateField('name', e.target.value)} />
          </FormField>

          <FormField label="Description" htmlFor="tag-description" error={fieldErrors.description}>
            <Textarea
              id="tag-description"
              value={values.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </FormField>

          <FormField label="Color" htmlFor="tag-color" required error={fieldErrors.color}>
            <ColorInput
              id="tag-color"
              value={values.color}
              onChange={(color) => updateField('color', color)}
            />
          </FormField>

          <FormField label="Status" htmlFor="tag-status" required error={fieldErrors.status}>
            <Select value={values.status} onValueChange={(v) => updateField('status', v as TagFormValues['status'])}>
              <SelectTrigger id="tag-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </form>
      )}
    </CustomDialog>
  )
}
