import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
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

export function TagEditorPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const role = useAppSelector((s) => s.auth.user?.role)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [values, setValues] = useState<TagFormValues>(defaultValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const submittedRef = useRef(false)

  const editor = useEpicCatalogEditor<Tag>(id, isNew, (s) => s.tags, tagsActions)
  usePlatformLoading(editor.loading ? 'Loading tag…' : null)

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
    if (!editor.error) navigate('/tags')
  }, [editor.saving, editor.error, navigate])

  if (!accessToken) return <Navigate to="/login" replace />
  if (role !== 'super_admin') return <Navigate to="/tags" replace />

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
    <FeaturePage
      title={isNew ? 'Create tag' : 'Edit tag'}
      actions={
        <Button variant="outline" asChild>
          <Link to="/tags">Back to list</Link>
        </Button>
      }
    >
      {!editor.loading ? (
        <form className="mx-auto max-w-xl space-y-4" onSubmit={handleSubmit}>
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
            <div className="flex items-center gap-2">
              <Input
                id="tag-color"
                value={values.color}
                onChange={(e) => updateField('color', e.target.value)}
              />
              <input
                type="color"
                aria-label="Pick color"
                value={values.color}
                onChange={(e) => updateField('color', e.target.value)}
              />
            </div>
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

          <Button type="submit" disabled={editor.saving}>
            {editor.saving ? 'Saving…' : isNew ? 'Create tag' : 'Save changes'}
          </Button>
        </form>
      ) : null}
    </FeaturePage>
  )
}
