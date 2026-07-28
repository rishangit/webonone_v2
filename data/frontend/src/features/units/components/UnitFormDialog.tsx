import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
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
import { DATA_FORM_DIALOG_SIZE } from '@/shared/utils/dataFormDialogSize'
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

interface UnitFormDialogProps {
  open: boolean
  id?: string
  onOpenChange: (open: boolean) => void
  onSaved: (unit?: Unit) => void
  chrome?: 'dialog' | 'embed-page'
  /** When > 0, always render local CustomDialog (stacked create from unit picker). */
  stackLevel?: number
}

export function UnitFormDialog({
  open,
  id,
  onOpenChange,
  onSaved,
  chrome = 'dialog',
  stackLevel = 0,
}: UnitFormDialogProps) {
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isNew = !id
  const title = isNew ? 'Create unit' : 'Edit unit'
  const path = isNew ? '/embed/dialogs/units/create' : `/embed/dialogs/units/${id}/edit`
  const idleSubmitLabel = isNew ? 'Create unit' : 'Save changes'
  const forceLocal = stackLevel > 0
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' && !forceLocal ? parentOrigin : null,
    open: chrome === 'dialog' && open && !forceLocal,
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
  const userRole = useAppSelector((s) => s.auth.user?.role)
  const canSetStatus = userRole === 'super_admin'
  const baseUnits = useAppSelector((s) => s.units.items)
  const [values, setValues] = useState<UnitFormValues>(defaultValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const submittedRef = useRef(false)

  const editor = useEpicCatalogEditor<Unit>(id, isNew, (s) => s.units, unitsActions)

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
    if (!editor.error) onSaved(editor.detail ?? undefined)
  }, [editor.saving, editor.error, editor.detail, onSaved])

  function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault()
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
      status: canSetStatus ? parsed.data.status : 'pending',
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
    <form id="unit-form" className="space-y-4" onSubmit={handleSubmit}>
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
      {canSetStatus ? (
        <FormField label="Status" htmlFor="unit-status" required>
          <Select value={values.status} onValueChange={(v) => setValues((prev) => ({ ...prev, status: v as UnitFormValues['status'] }))}>
            <SelectTrigger id="unit-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Unverified</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      ) : null}
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
      stackLevel={stackLevel}
      footer={actions}
    >
      {body}
    </CustomDialog>
  )
}
