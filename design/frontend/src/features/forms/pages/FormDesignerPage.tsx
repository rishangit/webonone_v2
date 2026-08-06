import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import { nanoid } from 'nanoid'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { formsActions } from '@/features/forms/store'
import { FormDesignerToolbox } from '@/features/forms/components/FormDesignerToolbox'
import { FormDesignerCanvas } from '@/features/forms/components/FormDesignerCanvas'
import { FormDesignerPropsPanel } from '@/features/forms/components/FormDesignerPropsPanel'
import { formDefinitionSchema } from '@/features/forms/schemas/formSchemas'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import type { FormDefinition, FormField, FormFieldType, FormTemplateStatus } from '@/shared/types/design.types'

function defaultField(type: FormFieldType): FormField {
  const id = nanoid(10)
  const base: FormField = {
    id,
    type,
    label:
      type === 'text'
        ? 'Text field'
        : type === 'textarea'
          ? 'Text area'
          : type === 'checkbox'
            ? 'Checkbox'
            : type === 'radio'
              ? 'Radio group'
              : 'Dropdown',
    required: false,
  }
  if (type === 'radio' || type === 'select') {
    base.options = [
      { id: nanoid(8), label: 'Option 1' },
      { id: nanoid(8), label: 'Option 2' },
    ]
  }
  if (type === 'text' || type === 'textarea' || type === 'select') {
    base.placeholder = ''
  }
  return base
}

export function FormDesignerPage() {
  const { t } = useTranslation('forms')

  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const { goToList } = useNavigateDesign()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const role = user?.role ?? 'member'
  const companyId = user?.companyId ?? null
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.forms)

  const [definition, setDefinition] = useState<FormDefinition>({ version: 1, fields: [] })
  const [name, setName] = useState('')
  const [status, setStatus] = useState<FormTemplateStatus>('draft')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [awaitingSave, setAwaitingSave] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const canManage = role === 'super_admin' || role === 'company_admin'
  const hasCompany = Boolean(companyId)
  const loading = hasCompany && detailStatus === 'loading' && (!detail || detail.id !== id)
  usePlatformLoading(loading ? t('loadingForm') : null)

  useEffect(() => {
    if (!accessToken || !id || !hasCompany) return
    dispatch(formsActions.fetchDetailRequested({ id, force: true }))
  }, [accessToken, dispatch, hasCompany, id])

  useEffect(() => {
    if (!detail || detail.id !== id) return
    setDefinition(detail.definition)
    setName(detail.name)
    setStatus(detail.status)
    setSelectedId(detail.definition.fields[0]?.id ?? null)
  }, [detail, id])

  useEffect(() => {
    if (!awaitingSave) return
    if (detailStatus === 'idle' && detail) {
      setAwaitingSave(false)
      toast({ title: 'Form saved' })
      setDefinition(detail.definition)
      setName(detail.name)
      setStatus(detail.status)
    }
    if (detailStatus === 'error') {
      setAwaitingSave(false)
    }
  }, [awaitingSave, detail, detailStatus, toast])

  const selectedField = useMemo(
    () => definition.fields.find((f) => f.id === selectedId) ?? null,
    [definition.fields, selectedId],
  )
  const selectedIndex = selectedField
    ? definition.fields.findIndex((f) => f.id === selectedField.id)
    : -1

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  if (!hasCompany) {
    return (
      <FeaturePage title={t('designer')} description="Company form templates.">
        <Alert>
          <AlertDescription>
            Select a company account in WebOnOne (account switcher) to design forms.
          </AlertDescription>
        </Alert>
        <Button type="button" variant="outline" className="mt-4" onClick={goToList}>
          Back to forms
        </Button>
      </FeaturePage>
    )
  }

  if (!id) {
    return <Navigate to="/forms" replace />
  }

  function addField(type: FormFieldType) {
    const field = defaultField(type)
    setDefinition((prev) => ({ ...prev, fields: [...prev.fields, field] }))
    setSelectedId(field.id)
  }

  function updateField(next: FormField) {
    setDefinition((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === next.id ? next : f)),
    }))
  }

  function removeField() {
    if (!selectedField) return
    setDefinition((prev) => {
      const fields = prev.fields.filter((f) => f.id !== selectedField.id)
      setSelectedId(fields[Math.max(0, selectedIndex - 1)]?.id ?? null)
      return { ...prev, fields }
    })
  }

  function moveField(direction: -1 | 1) {
    if (selectedIndex < 0) return
    const target = selectedIndex + direction
    if (target < 0 || target >= definition.fields.length) return
    setDefinition((prev) => {
      const fields = [...prev.fields]
      const [item] = fields.splice(selectedIndex, 1)
      fields.splice(target, 0, item)
      return { ...prev, fields }
    })
  }

  function handleSave() {
    const parsed = formDefinitionSchema.safeParse(definition)
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? 'Invalid form definition')
      return
    }
    setLocalError(null)
    setAwaitingSave(true)
    dispatch(
      formsActions.saveDetailRequested({
        id,
        body: {
          name,
          status,
          definition: parsed.data,
        },
      }),
    )
  }

  return (
    <FeaturePage
      title={name || 'Form designer'}
      description="Add fields from the toolbox, then configure labels and options."
      actions={
        <>
          <Button type="button" variant="outline" size="sm" onClick={goToList}>
            Back
          </Button>
          {canManage ? (
            <>
              <Select value={status} onValueChange={(v) => setStatus(v as FormTemplateStatus)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={detailStatus === 'saving'}
              >
                <Save className="h-4 w-4" aria-hidden />
                {detailStatus === 'saving' ? 'Saving…' : 'Save'}
              </Button>
            </>
          ) : null}
        </>
      }
    >
      {(localError || detailError) && awaitingSave === false && detailStatus === 'error' ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{localError ?? detailError}</AlertDescription>
        </Alert>
      ) : null}
      {localError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{localError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
        <aside className="rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg)/0.35)] p-4">
          <FormDesignerToolbox onAdd={addField} disabled={!canManage} />
        </aside>
        <section className="min-w-0">
          <FormDesignerCanvas
            fields={definition.fields}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </section>
        <aside className="rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg)/0.35)] p-4">
          <FormDesignerPropsPanel
            field={canManage ? selectedField : null}
            fieldIndex={selectedIndex}
            fieldCount={definition.fields.length}
            onChange={updateField}
            onRemove={removeField}
            onMove={moveField}
          />
        </aside>
      </div>
    </FeaturePage>
  )
}
