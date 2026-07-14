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
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { attributeFormSchema, type AttributeFormValues } from '@/features/attributes/schemas/attributeSchemas'
import { attributesActions } from '@/features/attributes/store'
import { unitsActions } from '@/features/units/store'
import { useEpicCatalogEditor } from '@/shared/hooks/useEpicCatalogEditor'
import type { Attribute } from '@/shared/types/data.types'

const defaultValues: AttributeFormValues = {
  name: '',
  description: '',
  valueType: 'text',
  unitId: '',
  status: 'pending',
}

export function AttributeEditorPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const role = useAppSelector((s) => s.auth.user?.role)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const units = useAppSelector((s) => s.units.items)
  const [values, setValues] = useState<AttributeFormValues>(defaultValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const submittedRef = useRef(false)

  const editor = useEpicCatalogEditor<Attribute>(id, isNew, (s) => s.attributes, attributesActions)
  usePlatformLoading(editor.loading ? 'Loading attribute…' : null)

  useEffect(() => {
    dispatch(unitsActions.loadListRequested({ pageSize: 100, force: true }))
  }, [dispatch])

  useEffect(() => {
    if (!editor.detail || isNew) return
    const attr = editor.detail
    setValues({
      name: attr.name,
      description: attr.description ?? '',
      valueType: attr.valueType,
      unitId: attr.unitId ?? '',
      status: attr.status,
    })
  }, [editor.detail, isNew])

  useEffect(() => {
    if (!submittedRef.current || editor.saving) return
    submittedRef.current = false
    if (!editor.error) navigate('/attributes')
  }, [editor.saving, editor.error, navigate])

  if (!accessToken) return <Navigate to="/login" replace />
  if (role !== 'super_admin') return <Navigate to="/attributes" replace />

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const parsed = attributeFormSchema.safeParse(values)
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
      value_type: parsed.data.valueType,
      unit_id: parsed.data.valueType === 'number' ? parsed.data.unitId || null : null,
      status: parsed.data.status,
    })
  }

  return (
    <FeaturePage
      title={isNew ? 'Create attribute' : 'Edit attribute'}
      actions={
        <Button variant="outline" asChild>
          <Link to="/attributes">Back to list</Link>
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
          <FormField label="Name" htmlFor="attr-name" required error={fieldErrors.name}>
            <Input id="attr-name" value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} />
          </FormField>
          <FormField label="Description" htmlFor="attr-description">
            <Textarea id="attr-description" value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
          </FormField>
          <FormField label="Value type" htmlFor="attr-value-type" required>
            <Select value={values.valueType} onValueChange={(v) => setValues((prev) => ({ ...prev, valueType: v as AttributeFormValues['valueType'] }))}>
              <SelectTrigger id="attr-value-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          {values.valueType === 'number' ? (
            <FormField label="Unit" htmlFor="attr-unit" required error={fieldErrors.unitId}>
              <Select value={values.unitId || ''} onValueChange={(v) => setValues((prev) => ({ ...prev, unitId: v }))}>
                <SelectTrigger id="attr-unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : null}
          <FormField label="Status" htmlFor="attr-status" required>
            <Select value={values.status} onValueChange={(v) => setValues((prev) => ({ ...prev, status: v as AttributeFormValues['status'] }))}>
              <SelectTrigger id="attr-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <Button type="submit" disabled={editor.saving}>
            {editor.saving ? 'Saving…' : isNew ? 'Create attribute' : 'Save changes'}
          </Button>
        </form>
      ) : null}
    </FeaturePage>
  )
}
