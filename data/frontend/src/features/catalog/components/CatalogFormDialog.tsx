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
  type SelectTagValue,
} from '@webonone/ui-kit'
import type { RootState } from '@/app/store'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { attributesActions } from '@/features/attributes/store'
import { productsActions } from '@/features/products/store'
import { spacesActions } from '@/features/spaces/store'
import { DATA_FORM_DIALOG_SIZE } from '@/shared/utils/dataFormDialogSize'
import {
  createNestedRequestId,
  TAG_SELECT_EMBED_PATH,
  TagSelectStackedDialogs,
  TagSelectTrigger,
  writeTagSelectSession,
} from '@/features/tags/components/TagSelectField'
import { useEpicCatalogEditor } from '@/shared/hooks/useEpicCatalogEditor'
import type { CatalogFeatureState } from '@webonone/store-kit'
import type { CatalogItem } from '@/shared/types/data.types'

type CatalogKind = 'products' | 'spaces'

const CONFIG: Record<
  CatalogKind,
  {
    label: string
    select: (s: RootState) => CatalogFeatureState<CatalogItem>
    actions: typeof productsActions
  }
> = {
  products: { label: 'Product', select: (s) => s.products, actions: productsActions },
  spaces: { label: 'Space', select: (s) => s.spaces, actions: spacesActions },
}

const TAG_PICKER_PEER_SIZE = {
  sizeWidth: 'small' as const,
  sizeHeight: 'large' as const,
}

type AttributeRow = {
  attributeId: string
  valueText: string
  valueNumber: string
}

function isSelectTagValue(value: unknown): value is SelectTagValue {
  if (!value || typeof value !== 'object') return false
  const tag = value as Record<string, unknown>
  return (
    typeof tag.id === 'string' &&
    typeof tag.name === 'string' &&
    typeof tag.color === 'string'
  )
}

function parseTagsPayload(payload: unknown): SelectTagValue[] | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  if (!Array.isArray(record.tags)) return null
  const tags = record.tags.filter(isSelectTagValue)
  return tags
}

interface CatalogFormDialogProps {
  kind: CatalogKind
  open: boolean
  id?: string
  onOpenChange: (open: boolean) => void
  onSaved: (item?: CatalogItem) => void
  chrome?: 'dialog' | 'embed-page'
}

export function CatalogFormDialog({
  kind,
  open,
  id,
  onOpenChange,
  onSaved,
  chrome = 'dialog',
}: CatalogFormDialogProps) {
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const config = CONFIG[kind]
  const isNew = !id
  const lowerLabel = config.label.toLowerCase()
  const title = isNew ? `Create ${lowerLabel}` : `Edit ${lowerLabel}`
  const path = isNew
    ? `/embed/dialogs/${kind}/create`
    : `/embed/dialogs/${kind}/${id}/edit`
  const idleSubmitLabel = isNew ? `Create ${lowerLabel}` : 'Save changes'
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
  const userRole = useAppSelector((s) => s.auth.user?.role)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const canSetStatus = userRole === 'super_admin'
  const attributes = useAppSelector((s) => s.attributes.items)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'verified' | 'pending'>('pending')
  const [selectedTags, setSelectedTags] = useState<SelectTagValue[]>([])
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [blockOuterDismiss, setBlockOuterDismiss] = useState(false)
  const [attributeRows, setAttributeRows] = useState<AttributeRow[]>([])
  const [nameError, setNameError] = useState<string | null>(null)
  const submittedRef = useRef(false)
  const tagPickerOpenRef = useRef(false)
  const blockOuterDismissRef = useRef(false)
  const blockTimerRef = useRef<number | null>(null)
  const nestedTagRequestIdRef = useRef<string | null>(null)

  const editor = useEpicCatalogEditor(id, isNew, config.select, config.actions)

  useEffect(() => {
    tagPickerOpenRef.current = tagPickerOpen
  }, [tagPickerOpen])

  useEffect(() => {
    return () => {
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
    }
  }, [])

  const closeTagPicker = useCallback(() => {
    setTagPickerOpen(false)
    tagPickerOpenRef.current = false
    nestedTagRequestIdRef.current = null
    blockOuterDismissRef.current = true
    setBlockOuterDismiss(true)
    if (blockTimerRef.current !== null) {
      window.clearTimeout(blockTimerRef.current)
    }
    blockTimerRef.current = window.setTimeout(() => {
      blockOuterDismissRef.current = false
      setBlockOuterDismiss(false)
      blockTimerRef.current = null
    }, 150)
  }, [])

  const openTagPicker = useCallback(() => {
    if (chrome === 'embed-page' && parentOrigin && dialogRequestId) {
      const nestedRequestId = createNestedRequestId()
      nestedTagRequestIdRef.current = nestedRequestId
      writeTagSelectSession(nestedRequestId, selectedTags)
      tagPickerOpenRef.current = true
      setTagPickerOpen(true)
      sendPlatformPeerDialogNestedRequest(parentOrigin, {
        parentRequestId: dialogRequestId,
        requestId: nestedRequestId,
        path: TAG_SELECT_EMBED_PATH,
        title: 'Select tags',
        description: 'Choose one or more tags, then click Done.',
        submitLabel: 'Done',
        ...TAG_PICKER_PEER_SIZE,
      })
      return
    }
    tagPickerOpenRef.current = true
    setTagPickerOpen(true)
  }, [chrome, dialogRequestId, parentOrigin, selectedTags])

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) {
      return
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin || event.source !== window.parent) {
        return
      }
      const nestedId = nestedTagRequestIdRef.current
      if (!nestedId) {
        return
      }

      if (
        isPlatformPeerDialogNestedResultMessage(event.data) &&
        event.data.parentRequestId === dialogRequestId &&
        event.data.requestId === nestedId
      ) {
        const tags = parseTagsPayload(event.data.payload)
        if (tags) {
          setSelectedTags(tags)
        }
        closeTagPicker()
        return
      }

      if (
        isPlatformPeerDialogNestedCancelMessage(event.data) &&
        event.data.parentRequestId === dialogRequestId &&
        event.data.requestId === nestedId
      ) {
        closeTagPicker()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [chrome, closeTagPicker, dialogRequestId, parentOrigin])

  usePlatformPeerDialogSubmit({
    parentOrigin: chrome === 'embed-page' ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: () => {
      if (tagPickerOpenRef.current) {
        return
      }
      handleSubmit()
    },
  })

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) return
    if (tagPickerOpen) {
      sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, true, idleSubmitLabel)
      return
    }
    sendPlatformPeerDialogBusy(
      parentOrigin,
      dialogRequestId,
      editor.saving,
      editor.saving ? 'Saving…' : idleSubmitLabel,
    )
  }, [
    chrome,
    dialogRequestId,
    editor.saving,
    idleSubmitLabel,
    parentOrigin,
    tagPickerOpen,
  ])

  useEffect(() => {
    dispatch(attributesActions.loadListRequested({ pageSize: 100, force: true }))
  }, [dispatch])

  useEffect(() => {
    if (!editor.detail || isNew) return
    const item = editor.detail
    setName(item.name)
    setDescription(item.description ?? '')
    setStatus(item.status)
    setSelectedTags(
      item.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
    )
    setAttributeRows(
      item.attributes.map((a) => ({
        attributeId: a.attributeId,
        valueText: a.valueText ?? '',
        valueNumber: a.valueNumber != null ? String(a.valueNumber) : '',
      })),
    )
  }, [editor.detail, isNew])

  useEffect(() => {
    if (!open) {
      setTagPickerOpen(false)
      tagPickerOpenRef.current = false
      nestedTagRequestIdRef.current = null
      setBlockOuterDismiss(false)
      blockOuterDismissRef.current = false
    }
  }, [open])

  useEffect(() => {
    if (!submittedRef.current || editor.saving) return
    submittedRef.current = false
    if (!editor.error) onSaved(editor.detail ?? undefined)
  }, [editor.saving, editor.error, editor.detail, onSaved])

  function addAttributeRow() {
    setAttributeRows((prev) => [...prev, { attributeId: '', valueText: '', valueNumber: '' }])
  }

  function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault()
    if (!name.trim()) {
      setNameError('Name is required')
      return
    }
    setNameError(null)

    submittedRef.current = true
    editor.save({
      name: name.trim(),
      description: description.trim() || null,
      status: canSetStatus ? status : 'pending',
      tag_ids: selectedTags.map((tag) => tag.id),
      attributes: attributeRows
        .filter((row) => row.attributeId)
        .map((row) => {
          const attr = attributes.find((a) => a.id === row.attributeId)
          if (attr?.valueType === 'number') {
            return { attribute_id: row.attributeId, value_number: Number(row.valueNumber) }
          }
          return { attribute_id: row.attributeId, value_text: row.valueText }
        }),
    })
  }

  function handleFormOpenChange(next: boolean) {
    if (next) return
    if (tagPickerOpenRef.current || tagPickerOpen) {
      closeTagPicker()
      return
    }
    if (blockOuterDismissRef.current || blockOuterDismiss) {
      return
    }
    onOpenChange(false)
  }

  const actions = (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
        onClick={() => handleFormOpenChange(false)}
        disabled={editor.saving}
      >
        Cancel
      </Button>
      <Button
        type="button"
        className="h-10 px-4"
        onClick={() => handleSubmit()}
        disabled={editor.saving || editor.loading || tagPickerOpen}
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
    <form id="catalog-form" className="space-y-4" onSubmit={handleSubmit}>
      {editor.error || nameError ? (
        <Alert variant="destructive">
          <AlertDescription>{editor.error ?? nameError}</AlertDescription>
        </Alert>
      ) : null}
      <FormField label="Name" htmlFor="catalog-name" required>
        <Input id="catalog-name" value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <FormField label="Description" htmlFor="catalog-description">
        <Textarea id="catalog-description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </FormField>
      {canSetStatus ? (
        <FormField label="Status" htmlFor="catalog-status" required>
          <Select value={status} onValueChange={(v) => setStatus(v as 'verified' | 'pending')}>
            <SelectTrigger id="catalog-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Unverified</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      ) : null}
      <FormField label="Tags" htmlFor="catalog-tags">
        <TagSelectTrigger
          selectedTags={selectedTags}
          onOpen={openTagPicker}
          disabled={!accessToken || editor.saving}
        />
      </FormField>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Attributes</p>
          <Button type="button" size="sm" variant="outline" onClick={addAttributeRow}>
            Add attribute
          </Button>
        </div>
        {attributeRows.map((row, index) => {
          const attr = attributes.find((a) => a.id === row.attributeId)
          return (
            <div key={index} className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
              <Select
                value={row.attributeId}
                onValueChange={(v) =>
                  setAttributeRows((rows) =>
                    rows.map((r, i) => (i === index ? { ...r, attributeId: v } : r)),
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Attribute" />
                </SelectTrigger>
                <SelectContent>
                  {attributes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {attr?.valueType === 'number' ? (
                <Input
                  type="number"
                  placeholder="Value"
                  value={row.valueNumber}
                  onChange={(e) =>
                    setAttributeRows((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, valueNumber: e.target.value } : r)),
                    )
                  }
                />
              ) : (
                <Input
                  placeholder="Value"
                  value={row.valueText}
                  onChange={(e) =>
                    setAttributeRows((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, valueText: e.target.value } : r)),
                    )
                  }
                />
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAttributeRows((rows) => rows.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          )
        })}
      </div>
    </form>
  )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
  }

  if (isHosted) {
    return null
  }

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={handleFormOpenChange}
        title={title}
        sizeWidth={DATA_FORM_DIALOG_SIZE.sizeWidth}
        sizeHeight={DATA_FORM_DIALOG_SIZE.sizeHeight}
        nestedDismissGuard={tagPickerOpen || blockOuterDismiss}
        footer={actions}
      >
        {body}
      </CustomDialog>
      <TagSelectStackedDialogs
        pickerOpen={tagPickerOpen}
        selectedTags={selectedTags}
        onDone={(tags) => {
          setSelectedTags(tags)
          closeTagPicker()
        }}
        onClosePicker={closeTagPicker}
        pickerStackLevel={1}
      />
    </>
  )
}
