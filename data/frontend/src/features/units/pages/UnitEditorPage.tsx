import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  FeaturePage,
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
import { useAppSelector } from '@/app/store/hooks'
import { unitFormSchema, type UnitFormValues } from '@/features/units/schemas/unitSchemas'
import { dataApi } from '@/shared/services/dataApi'
import type { Unit } from '@/shared/types/data.types'

const defaultValues: UnitFormValues = {
  name: '',
  description: '',
  symbol: '',
  isBase: false,
  baseUnitId: '',
  status: 'pending',
}

export function UnitEditorPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const role = useAppSelector((s) => s.auth.user?.role)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [values, setValues] = useState<UnitFormValues>(defaultValues)
  const [baseUnits, setBaseUnits] = useState<Unit[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    dataApi.listUnits({ is_base: 'true', pageSize: 100 }).then((res) => setBaseUnits(res.items))
  }, [])

  useEffect(() => {
    if (isNew || !id) return
    setLoading(true)
    dataApi
      .getUnit(id)
      .then((unit) => {
        setValues({
          name: unit.name,
          description: unit.description ?? '',
          symbol: unit.symbol,
          isBase: unit.isBase,
          baseUnitId: unit.baseUnitId ?? '',
          status: unit.status,
        })
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isNew])

  if (!accessToken) return <Navigate to="/login" replace />
  if (role !== 'super_admin') return <Navigate to="/units" replace />

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const parsed = unitFormSchema.safeParse(values)
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
        symbol: parsed.data.symbol,
        is_base: parsed.data.isBase,
        base_unit_id: parsed.data.isBase ? null : parsed.data.baseUnitId || null,
        status: parsed.data.status,
      }
      if (isNew) await dataApi.createUnit(body)
      else await dataApi.updateUnit(id!, body)
      navigate('/units')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FeaturePage
      title={isNew ? 'Create unit' : 'Edit unit'}
      actions={
        <Button variant="outline" asChild>
          <Link to="/units">Back to list</Link>
        </Button>
      }
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <form className="mx-auto max-w-xl space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <FormField label="Name" htmlFor="unit-name" required error={fieldErrors.name}>
            <Input id="unit-name" value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} />
          </FormField>
          <FormField label="Symbol" htmlFor="unit-symbol" required error={fieldErrors.symbol}>
            <Input id="unit-symbol" value={values.symbol} onChange={(e) => setValues((v) => ({ ...v, symbol: e.target.value }))} />
          </FormField>
          <FormField label="Description" htmlFor="unit-description">
            <Textarea id="unit-description" value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={values.isBase} onCheckedChange={(checked) => setValues((v) => ({ ...v, isBase: Boolean(checked) }))} />
            Is base unit
          </label>
          {!values.isBase ? (
            <FormField label="Base unit" htmlFor="unit-base">
              <Select value={values.baseUnitId || ''} onValueChange={(v) => setValues((prev) => ({ ...prev, baseUnitId: v }))}>
                <SelectTrigger id="unit-base">
                  <SelectValue placeholder="Select base unit" />
                </SelectTrigger>
                <SelectContent>
                  {baseUnits.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : null}
          <FormField label="Status" htmlFor="unit-status" required>
            <Select value={values.status} onValueChange={(v) => setValues((prev) => ({ ...prev, status: v as UnitFormValues['status'] }))}>
              <SelectTrigger id="unit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Create unit' : 'Save changes'}
          </Button>
        </form>
      )}
    </FeaturePage>
  )
}
