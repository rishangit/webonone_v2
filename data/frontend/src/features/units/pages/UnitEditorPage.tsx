import { useEffect, useRef, useState } from 'react'
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
  Textarea,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { unitFormSchema, type UnitFormValues } from '@/features/units/schemas/unitSchemas'
import { unitsActions } from '@/features/units/store'
import { useEpicCatalogEditor } from '@/shared/hooks/useEpicCatalogEditor'
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
  const dispatch = useAppDispatch()
  const role = useAppSelector((s) => s.auth.user?.role)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const baseUnits = useAppSelector((s) => s.units.items)
  const [values, setValues] = useState<UnitFormValues>(defaultValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const submittedRef = useRef(false)

  const editor = useEpicCatalogEditor<Unit>(id, isNew, (s) => s.units, unitsActions)
  usePlatformLoading(editor.loading ? 'Loading unit…' : null)

  useEffect(() => {
    dispatch(unitsActions.loadListRequested({ pageSize: 100, extra: { is_base: 'true' }, force: true }))
  }, [dispatch])

  useEffect(() => {
    if (!editor.detail || isNew) return
    const unit = editor.detail
    setValues({
      name: unit.name,
      description: unit.description ?? '',
      symbol: unit.symbol,
      isBase: unit.isBase,
      baseUnitId: unit.baseUnitId ?? '',
      status: unit.status,
    })
  }, [editor.detail, isNew])

  useEffect(() => {
    if (!submittedRef.current || editor.saving) return
    submittedRef.current = false
    if (!editor.error) navigate('/units')
  }, [editor.saving, editor.error, navigate])

  if (!accessToken) return <Navigate to="/login" replace />
  if (role !== 'super_admin') return <Navigate to="/units" replace />

  function handleSubmit(event: React.FormEvent) {
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

    submittedRef.current = true
    editor.save({
      name: parsed.data.name,
      description: parsed.data.description || null,
      symbol: parsed.data.symbol,
      is_base: parsed.data.isBase,
      base_unit_id: parsed.data.isBase ? null : parsed.data.baseUnitId || null,
      status: parsed.data.status,
    })
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
      {!editor.loading ? (
        <form className="mx-auto max-w-xl space-y-4" onSubmit={handleSubmit}>
          {editor.error ? (
            <Alert variant="destructive">
              <AlertDescription>{editor.error}</AlertDescription>
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
          <Button type="submit" disabled={editor.saving}>
            {editor.saving ? 'Saving…' : isNew ? 'Create unit' : 'Save changes'}
          </Button>
        </form>
      ) : null}
    </FeaturePage>
  )
}
