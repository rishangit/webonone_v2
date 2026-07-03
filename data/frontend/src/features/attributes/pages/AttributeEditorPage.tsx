import { useEffect, useState } from 'react'
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
  LoadingState,
  Textarea,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { attributeFormSchema, type AttributeFormValues } from '@/features/attributes/schemas/attributeSchemas'
import { dataApi } from '@/shared/services/dataApi'
import type { Unit } from '@/shared/types/data.types'

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
  const role = useAppSelector((s) => s.auth.user?.role)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [values, setValues] = useState<AttributeFormValues>(defaultValues)
  const [units, setUnits] = useState<Unit[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    dataApi.listUnits({ pageSize: 100 }).then((res) => setUnits(res.items))
  }, [])

  useEffect(() => {
    if (isNew || !id) return
    setLoading(true)
    dataApi
      .getAttribute(id)
      .then((attr) => {
        setValues({
          name: attr.name,
          description: attr.description ?? '',
          valueType: attr.valueType,
          unitId: attr.unitId ?? '',
          status: attr.status,
        })
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isNew])

  if (!accessToken) return <Navigate to="/login" replace />
  if (role !== 'super_admin') return <Navigate to="/attributes" replace />

  async function handleSubmit(event: React.FormEvent) {
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

    setSaving(true)
    setError(null)
    try {
      const body = {
        name: parsed.data.name,
        description: parsed.data.description || null,
        value_type: parsed.data.valueType,
        unit_id: parsed.data.valueType === 'number' ? parsed.data.unitId || null : null,
        status: parsed.data.status,
      }
      if (isNew) await dataApi.createAttribute(body)
      else await dataApi.updateAttribute(id!, body)
      navigate('/attributes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
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
      {loading ? (
        <LoadingState label="Loading attribute…" />
      ) : (
        <form className="mx-auto max-w-xl space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
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
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Create attribute' : 'Save changes'}
          </Button>
        </form>
      )}
    </FeaturePage>
  )
}
