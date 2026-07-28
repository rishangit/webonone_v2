import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  isPlatformPeerDialogNestedCancelMessage,
  isPlatformPeerDialogNestedResultMessage,
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  sendPlatformPeerDialogNestedRequest,
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
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { attributeFormSchema, type AttributeFormValues } from '@/features/attributes/schemas/attributeSchemas'
import { attributesActions } from '@/features/attributes/store'
import {
  createNestedRequestId,
  toUnitSelectValue,
  UNIT_PICKER_DIALOG,
  UNIT_SELECT_EMBED_PATH,
  UnitSelectStackedDialogs,
  UnitSelectTrigger,
  writeUnitSelectSession,
  type UnitSelectValue,
} from '@/features/units/components/UnitSelectField'
import { useEpicCatalogEditor } from '@/shared/hooks/useEpicCatalogEditor'
import { dataApi } from '@/shared/services/dataApi'
import type { Attribute } from '@/shared/types/data.types'

/** Taller than default catalog forms so Unit of measure stays visible with Status. */
const ATTRIBUTE_FORM_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

const defaultValues: AttributeFormValues = {
  name: '',
  description: '',
  valueType: 'text',
  unitId: '',
  status: 'pending',
}

function isUnitSelectValue(value: unknown): value is UnitSelectValue {
  if (!value || typeof value !== 'object') return false
  const unit = value as Record<string, unknown>
  return (
    typeof unit.id === 'string' &&
    typeof unit.name === 'string' &&
    typeof unit.symbol === 'string'
  )
}

interface AttributeFormDialogProps {
  open: boolean
  id?: string
  onOpenChange: (open: boolean) => void
  onSaved: (attribute?: Attribute) => void
  chrome?: 'dialog' | 'embed-page'
  /** When > 0, always render local CustomDialog (stacked create from attribute picker). */
  stackLevel?: number
}

export function AttributeFormDialog({
  open,
  id,
  onOpenChange,
  onSaved,
  chrome = 'dialog',
  stackLevel = 0,
}: AttributeFormDialogProps) {
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isNew = !id
  const title = isNew ? 'Create attribute' : 'Edit attribute'
  const path = isNew
    ? '/embed/dialogs/attributes/create'
    : `/embed/dialogs/attributes/${id}/edit`
  const idleSubmitLabel = isNew ? 'Create attribute' : 'Save changes'
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
    ...ATTRIBUTE_FORM_DIALOG_SIZE,
    onResult: () => {
      onSaved()
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  const userRole = useAppSelector((s) => s.auth.user?.role)
  const canSetStatus = userRole === 'super_admin'
  const [values, setValues] = useState<AttributeFormValues>(defaultValues)
  const [selectedUnit, setSelectedUnit] = useState<UnitSelectValue | null>(null)
  const [unitPickerOpen, setUnitPickerOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const submittedRef = useRef(false)
  const unitPickerOpenRef = useRef(false)
  const nestedUnitRequestIdRef = useRef<string | null>(null)

  const editor = useEpicCatalogEditor<Attribute>(id, isNew, (s) => s.attributes, attributesActions)

  const closeUnitPicker = useCallback(() => {
    unitPickerOpenRef.current = false
    setUnitPickerOpen(false)
    nestedUnitRequestIdRef.current = null
  }, [])

  const openUnitPicker = useCallback(() => {
    if (chrome === 'embed-page' && parentOrigin && dialogRequestId) {
      const nestedRequestId = createNestedRequestId()
      nestedUnitRequestIdRef.current = nestedRequestId
      writeUnitSelectSession(nestedRequestId, selectedUnit)
      unitPickerOpenRef.current = true
      setUnitPickerOpen(true)
      sendPlatformPeerDialogNestedRequest(parentOrigin, {
        parentRequestId: dialogRequestId,
        requestId: nestedRequestId,
        path: UNIT_SELECT_EMBED_PATH,
        title: 'Choose unit',
        description: 'Select a unit of measure, or None if not applicable.',
        submitLabel: 'Done',
        ...UNIT_PICKER_DIALOG,
      })
      return
    }
    unitPickerOpenRef.current = true
    setUnitPickerOpen(true)
  }, [chrome, dialogRequestId, parentOrigin, selectedUnit])

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) {
      return
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin || event.source !== window.parent) {
        return
      }
      const nestedId = nestedUnitRequestIdRef.current
      if (!nestedId) {
        return
      }

      if (
        isPlatformPeerDialogNestedResultMessage(event.data) &&
        event.data.parentRequestId === dialogRequestId &&
        event.data.requestId === nestedId
      ) {
        const payload = event.data.payload
        const unit =
          payload && typeof payload === 'object' && 'unit' in payload
            ? isUnitSelectValue((payload as { unit: unknown }).unit)
              ? (payload as { unit: UnitSelectValue }).unit
              : (payload as { unit: unknown }).unit === null
                ? null
                : undefined
            : undefined
        if (unit !== undefined) {
          setSelectedUnit(unit)
          setValues((prev) => ({ ...prev, unitId: unit?.id ?? '' }))
          setFieldErrors((prev) => {
            if (!prev.unitId) return prev
            const next = { ...prev }
            delete next.unitId
            return next
          })
        }
        closeUnitPicker()
        return
      }

      if (
        isPlatformPeerDialogNestedCancelMessage(event.data) &&
        event.data.parentRequestId === dialogRequestId &&
        event.data.requestId === nestedId
      ) {
        closeUnitPicker()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [chrome, closeUnitPicker, dialogRequestId, parentOrigin])

  usePlatformPeerDialogSubmit({
    parentOrigin: chrome === 'embed-page' ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: () => {
      if (unitPickerOpenRef.current) {
        return
      }
      handleSubmit()
    },
  })

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) return
    if (unitPickerOpen) {
      return
    }
    sendPlatformPeerDialogBusy(
      parentOrigin,
      dialogRequestId,
      editor.saving,
      editor.saving ? 'Saving…' : idleSubmitLabel,
    )
  }, [chrome, dialogRequestId, editor.saving, idleSubmitLabel, parentOrigin, unitPickerOpen])

  useEffect(() => {
    if (!open) {
      setValues(defaultValues)
      setSelectedUnit(null)
      setFieldErrors({})
      closeUnitPicker()
    }
  }, [closeUnitPicker, open])

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

    if (!attr.unitId) {
      setSelectedUnit(null)
      return
    }

    let cancelled = false
    void dataApi
      .getUnit(attr.unitId)
      .then((unit) => {
        if (cancelled) return
        setSelectedUnit(toUnitSelectValue(unit))
      })
      .catch(() => {
        if (cancelled) return
        setSelectedUnit({ id: attr.unitId!, name: attr.unitId!, symbol: '' })
      })

    return () => {
      cancelled = true
    }
  }, [editor.detail, isNew])

  useEffect(() => {
    if (!submittedRef.current || editor.saving) return
    submittedRef.current = false
    if (!editor.error) {
      onSaved(editor.detail ?? undefined)
      if (forceLocal) {
        onOpenChange(false)
      }
    }
  }, [editor.saving, editor.error, editor.detail, forceLocal, onOpenChange, onSaved])

  function handleValueTypeChange(next: AttributeFormValues['valueType']) {
    setValues((prev) => ({
      ...prev,
      valueType: next,
    }))
    setFieldErrors((prev) => {
      if (!prev.valueType) return prev
      const nextErrors = { ...prev }
      delete nextErrors.valueType
      return nextErrors
    })
  }

  function handleUnitDone(unit: UnitSelectValue | null) {
    setSelectedUnit(unit)
    setValues((prev) => ({ ...prev, unitId: unit?.id ?? '' }))
    setFieldErrors((prev) => {
      if (!prev.unitId) return prev
      const next = { ...prev }
      delete next.unitId
      return next
    })
    closeUnitPicker()
  }

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
      unit_id: parsed.data.unitId || null,
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
    <form id="attribute-form" className="space-y-4" onSubmit={handleSubmit}>
      {editor.error ? (
        <Alert variant="destructive">
          <AlertDescription>{editor.error}</AlertDescription>
        </Alert>
      ) : null}
      <FormField label="Name" htmlFor="attr-name" required error={fieldErrors.name}>
        <Input
          id="attr-name"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
        />
      </FormField>
      <FormField label="Description" htmlFor="attr-description">
        <Textarea
          id="attr-description"
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        />
      </FormField>
      <FormField label="Value type" htmlFor="attr-value-type" required>
        <Select
          value={values.valueType}
          onValueChange={(v) => handleValueTypeChange(v as AttributeFormValues['valueType'])}
        >
          <SelectTrigger id="attr-value-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="number">Number</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Unit of measure" htmlFor="attr-unit" error={fieldErrors.unitId}>
        <UnitSelectTrigger
          id="attr-unit"
          selectedUnit={selectedUnit}
          onOpen={openUnitPicker}
          disabled={editor.saving}
        />
      </FormField>
      {canSetStatus ? (
        <FormField label="Status" htmlFor="attr-status" required>
          <Select
            value={values.status}
            onValueChange={(v) =>
              setValues((prev) => ({ ...prev, status: v as AttributeFormValues['status'] }))
            }
          >
            <SelectTrigger id="attr-status">
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
    return <div className="flex w-full flex-col gap-4 overflow-y-auto p-4 sm:p-6">{body}</div>
  }

  if (isHosted) {
    return null
  }

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        sizeWidth={ATTRIBUTE_FORM_DIALOG_SIZE.sizeWidth}
        sizeHeight={ATTRIBUTE_FORM_DIALOG_SIZE.sizeHeight}
        stackLevel={stackLevel}
        nestedDismissGuard={unitPickerOpen}
        footer={actions}
      >
        {body}
      </CustomDialog>
      <UnitSelectStackedDialogs
        pickerOpen={unitPickerOpen}
        selectedUnit={selectedUnit}
        onDone={handleUnitDone}
        onClosePicker={closeUnitPicker}
        pickerStackLevel={stackLevel + 1}
      />
    </>
  )
}
