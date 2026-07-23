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
import type { RootState } from '@/app/store'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { attributesActions } from '@/features/attributes/store'
import { productsActions } from '@/features/products/store'
import { servicesActions } from '@/features/services/store'
import { spacesActions } from '@/features/spaces/store'
import { DATA_FORM_DIALOG_SIZE } from '@/shared/utils/dataFormDialogSize'
import { tagsActions } from '@/features/tags/store'
import { useEpicCatalogEditor } from '@/shared/hooks/useEpicCatalogEditor'
import type { CatalogFeatureState } from '@webonone/store-kit'
import type { CatalogItem } from '@/shared/types/data.types'

type CatalogKind = 'products' | 'services' | 'spaces'

const CONFIG: Record<
  CatalogKind,
  {
    label: string
    select: (s: RootState) => CatalogFeatureState<CatalogItem>
    actions: typeof productsActions
  }
> = {
  products: { label: 'Product', select: (s) => s.products, actions: productsActions },
  services: { label: 'Service', select: (s) => s.services, actions: servicesActions },
  spaces: { label: 'Space', select: (s) => s.spaces, actions: spacesActions },
}

type AttributeRow = {
  attributeId: string
  valueText: string
  valueNumber: string
}

interface CatalogFormDialogProps {
  kind: CatalogKind
  open: boolean
  id?: string
  onOpenChange: (open: boolean) => void
  onSaved: () => void
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
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
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
  const canSetStatus = userRole === 'super_admin'
  const tags = useAppSelector((s) => s.tags.items)
  const attributes = useAppSelector((s) => s.attributes.items)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'verified' | 'pending'>('pending')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [attributeRows, setAttributeRows] = useState<AttributeRow[]>([])
  const [nameError, setNameError] = useState<string | null>(null)
  const submittedRef = useRef(false)

  const editor = useEpicCatalogEditor(id, isNew, config.select, config.actions)

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
    dispatch(tagsActions.loadListRequested({ pageSize: 100, force: true }))
    dispatch(attributesActions.loadListRequested({ pageSize: 100, force: true }))
  }, [dispatch])

  useEffect(() => {
    if (!editor.detail || isNew) return
    const item = editor.detail
    setName(item.name)
    setDescription(item.description ?? '')
    setStatus(item.status)
    setTagIds(item.tags.map((t) => t.id))
    setAttributeRows(
      item.attributes.map((a) => ({
        attributeId: a.attributeId,
        valueText: a.valueText ?? '',
        valueNumber: a.valueNumber != null ? String(a.valueNumber) : '',
      })),
    )
  }, [editor.detail, isNew])

  useEffect(() => {
    if (!submittedRef.current || editor.saving) return
    submittedRef.current = false
    if (!editor.error) onSaved()
  }, [editor.saving, editor.error, onSaved])

  function toggleTag(tagId: string) {
    setTagIds((prev) => (prev.includes(tagId) ? prev.filter((tid) => tid !== tagId) : [...prev, tagId]))
  }

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
      tag_ids: tagIds,
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
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Button
              key={tag.id}
              type="button"
              size="sm"
              variant={tagIds.includes(tag.id) ? 'default' : 'outline'}
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
            </Button>
          ))}
        </div>
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
