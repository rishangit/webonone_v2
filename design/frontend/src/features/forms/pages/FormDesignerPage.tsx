import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import { nanoid } from 'nanoid'
import { PlatformHostedEndPanel } from '@webonone/platform-embed'
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
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { formsActions } from '@/features/forms/store'
import { FormDesignerToolbox } from '@/features/forms/components/FormDesignerToolbox'
import { FormDesignerCanvas } from '@/features/forms/components/FormDesignerCanvas'
import { FormDesignerPropsPanel } from '@/features/forms/components/FormDesignerPropsPanel'
import { formDefinitionSchema } from '@/features/forms/schemas/formSchemas'
import {
  isFormFieldPropertiesPanelMessage,
  type FormFieldPropertiesPanelDraft,
  type FormFieldPropertiesPanelState,
} from '@/features/forms/utils/formFieldPropertiesPanel'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import type { FormDefinition, FormField, FormFieldType, FormTemplateStatus } from '@/shared/types/design.types'

function defaultField(type: FormFieldType, t: (key: string) => string): FormField {
  const id = nanoid(10)
  const base: FormField = {
    id,
    type,
    label:
      type === 'text'
        ? t('textField')
        : type === 'textarea'
          ? t('textArea')
          : type === 'checkbox'
            ? t('checkbox')
            : type === 'radio'
              ? t('radioGroup')
              : t('dropdown'),
    required: false,
  }
  if (type === 'radio' || type === 'select') {
    base.options = [
      { id: nanoid(8), label: t('option1') },
      { id: nanoid(8), label: t('option2') },
    ]
  }
  if (type === 'text' || type === 'textarea' || type === 'select') {
    base.placeholder = ''
  }
  return base
}

export function FormDesignerPage() {
  const { t } = useTranslation('forms')
  const { t: tc } = useTranslation('common')

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
  const [propsOpen, setPropsOpen] = useState(false)
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
    setSelectedId(null)
    setPropsOpen(false)
  }, [detail, id])

  useEffect(() => {
    if (!awaitingSave) return
    if (detailStatus === 'idle' && detail) {
      setAwaitingSave(false)
      toast({ title: t('saved') })
      setDefinition(detail.definition)
      setName(detail.name)
      setStatus(detail.status)
    }
    if (detailStatus === 'error') {
      setAwaitingSave(false)
    }
  }, [awaitingSave, detail, detailStatus, t, toast])

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
      <FeaturePage
        title={t('designer')}
        description={t('companyTemplates')}
        onBack={goToList}
        backLabel={tc('back')}
      >
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (!id) {
    return <Navigate to="/forms" replace />
  }

  function addField(type: FormFieldType) {
    const field = defaultField(type, t)
    setDefinition((prev) => ({ ...prev, fields: [...prev.fields, field] }))
    setSelectedId(field.id)
    setPropsOpen(true)
  }

  function selectField(id: string) {
    setSelectedId(id)
  }

  function openFieldProps(id: string) {
    setSelectedId(id)
    setPropsOpen(true)
  }

  function closeFieldProps() {
    setPropsOpen(false)
    setSelectedId(null)
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
      const nextId = fields[Math.max(0, selectedIndex - 1)]?.id ?? null
      setSelectedId(nextId)
      if (!nextId) setPropsOpen(false)
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
      setLocalError(parsed.error.issues[0]?.message ?? t('invalidDefinition'))
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

  function handlePanelDraftMessage(draft: unknown) {
    if (!draft || typeof draft !== 'object' || !('kind' in draft)) {
      return
    }
    const message = draft as FormFieldPropertiesPanelDraft
    if (!isFormFieldPropertiesPanelMessage(message)) {
      return
    }
    if (message.kind === 'field') {
      updateField(message.field)
      return
    }
    if (message.kind === 'move') {
      moveField(message.direction)
      return
    }
    removeField()
  }

  const panelDraft = useMemo<FormFieldPropertiesPanelState | undefined>(() => {
    if (!selectedField) {
      return undefined
    }
    return {
      kind: 'state',
      field: selectedField,
      fieldIndex: selectedIndex,
      fieldCount: definition.fields.length,
    }
  }, [definition.fields.length, selectedField, selectedIndex])

  return (
    <FeaturePage
      title={name || t('designer')}
      description={t('designerDescription')}
      onBack={goToList}
      backLabel={tc('back')}
      actions={
        canManage ? (
          <>
            <Select value={status} onValueChange={(v) => setStatus(v as FormTemplateStatus)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t('draft')}</SelectItem>
                <SelectItem value="published">{t('published')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={detailStatus === 'saving'}
            >
              <Save className="h-4 w-4" aria-hidden />
              {detailStatus === 'saving' ? t('saving') : tc('save')}
            </Button>
          </>
        ) : undefined
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

      <PlatformHostedEndPanel
        open={propsOpen && canManage}
        onOpenChange={(open) => {
          if (!open) closeFieldProps()
        }}
        path="/embed/panels/forms/field-properties"
        title={t('fieldProperties')}
        panelDraft={panelDraft}
        onPanelDraftMessage={handlePanelDraftMessage}
        isAllowedParentOrigin={isAllowedParentOrigin}
      >
        <FormDesignerPropsPanel
          field={selectedField}
          fieldIndex={selectedIndex}
          fieldCount={definition.fields.length}
          onChange={updateField}
          onRemove={removeField}
          onMove={moveField}
        />
      </PlatformHostedEndPanel>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <aside className="shell-glass rounded-lg border border-[hsl(var(--shell-chrome-border))] p-3 lg:w-[220px] lg:shrink-0 lg:p-4">
          <FormDesignerToolbox onAdd={addField} disabled={!canManage} />
        </aside>
        <section className="min-w-0 flex-1">
          <FormDesignerCanvas
            fields={definition.fields}
            selectedId={selectedId}
            canEdit={canManage}
            onSelect={selectField}
            onEdit={openFieldProps}
          />
        </section>
      </div>
    </FeaturePage>
  )
}
