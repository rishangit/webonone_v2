import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogBusy,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Button,
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
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { attributeFormSchema, type AttributeFormValues } from '@/features/attributes/schemas/attributeSchemas'
import { attributesActions } from '@/features/attributes/store'
import { DATA_FORM_DIALOG_SIZE } from '@/shared/utils/dataFormDialogSize'
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

interface AttributeFormDialogProps {
  open: boolean
  id?: string
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  chrome?: 'dialog' | 'embed-page'
}

export function AttributeFormDialog({
  open,
  id,
  onOpenChange,
  onSaved,
  chrome = 'dialog',
}: AttributeFormDialogProps) {
  const [searchParams] = useSearchParams()
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isNew = !id
  const title = isNew ? 'Create attribute' : 'Edit attribute'
  const path = isNew
    ? '/embed/dialogs/attributes/create'
    : `/embed/dialogs/attributes/${id}/edit`
  const idleSubmitLabel = isNew ? 'Create attribute' : 'Save changes'
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path,
    title,
    submitLabel: idleSubmitLabel,
    ...DATA_FORM_DIALOG_SIZE,
    onResult: () => {
      onSaved()
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  const dispatch = useAppDispatch()
  const units = useAppSelector((s) => s.units.items)
  const [values, setValues] = useState<AttributeFormValues>(defaultValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const submittedRef = useRef(false)

  const editor = useEpicCatalogEditor<Attribute>(id, isNew, (s) => s.attributes, attributesActions)

  usePlatformPeerDialogSubmit({
    parentOrigin: chrome === 'embed-page' ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: () => {
      handleSubmit()
    },
  })

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) return
    sendPlatformPeerDialogBusy(
      parentOrigin,
      dialogRequestId,
      editor.saving,
      editor.saving ? 'Saving…' : idleSubmitLabel,
    )
  }, [chrome, dialogRequestId, editor.saving, idleSubmitLabel, parentOrigin])

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
    if (!editor.error) onSaved()
  }, [editor.saving, editor.error, onSaved])

  function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault()
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

  const actions = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={editor.saving}
      >
        Cancel
      </Button>
      <Button
        type="button"
        onClick={() => handleSubmit()}
        disabled={editor.saving || editor.loading}
      >
        {editor.saving ? 'Saving…' : idleSubmitLabel}
      </Button>
    </>
  )

  const body = editor.loading ? (
    <div className="flex min-h-[200px] items-center justify-center">
      <Spinner size="lg" />
    </div>
  ) : (
    <form id="attribute-form" className="space-y-4" onSubmit={handleSubmit}>
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
    </form>
  )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
  }

  if (isHosted) {
    return null
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      sizeWidth={DATA_FORM_DIALOG_SIZE.sizeWidth}
      sizeHeight={DATA_FORM_DIALOG_SIZE.sizeHeight}
      footer={actions}
    >
      {body}
    </CustomDialog>
  )
}
