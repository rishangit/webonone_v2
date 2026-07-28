import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Save, Trash2 } from 'lucide-react'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  CustomDialog,
  DropdownMenuItem,
  DropdownMenuSeparator,
  FormField,
  Input,
  InputGroup,
  InputGroupText,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  itemListRowActiveClassName,
  StatusTag,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import {
  catalogAttributeNumberValueSchema,
  catalogAttributeTextValueSchema,
} from '@/features/catalog/schemas/catalogAttributeValueSchemas'
import {
  addCatalogEntityAttributeValue,
  deleteCatalogEntityAttributeValue,
  formatCatalogAttributeEntry,
  type CatalogEntityKind,
  setCatalogEntityAttributeValueDefault,
  updateCatalogEntityAttributeValue,
} from '@/features/catalog/utils/catalogAttributeApi'
import { DATA_FORM_DIALOG_SIZE } from '@/shared/utils/dataFormDialogSize'
import type {
  CatalogAttributeValue,
  CatalogAttributeValueEntry,
  CatalogItem,
} from '@/shared/types/data.types'

export const ATTRIBUTE_VALUE_DIALOG_SIZE = {
  sizeWidth: DATA_FORM_DIALOG_SIZE.sizeWidth,
  sizeHeight: DATA_FORM_DIALOG_SIZE.sizeHeight,
}

export function attributeValueCreateEmbedPath(
  kind: CatalogEntityKind,
  entityId: string,
  attributeId: string,
): string {
  return `/embed/dialogs/${kind}/${entityId}/attributes/${attributeId}/values/create`
}

export function attributeValueEditEmbedPath(
  kind: CatalogEntityKind,
  entityId: string,
  attributeId: string,
  valueId: string,
): string {
  return `/embed/dialogs/${kind}/${entityId}/attributes/${attributeId}/values/${valueId}/edit`
}

type CatalogAttributeValueDialogProps = {
  open: boolean
  kind: CatalogEntityKind
  entityId: string
  attribute: CatalogAttributeValue
  value?: CatalogAttributeValueEntry | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  chrome?: 'dialog' | 'embed-page'
}

export function CatalogAttributeValueDialog({
  open,
  kind,
  entityId,
  attribute,
  value = null,
  onOpenChange,
  onSaved,
  chrome = 'dialog',
}: CatalogAttributeValueDialogProps) {
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const [editingValue, setEditingValue] = useState<CatalogAttributeValueEntry | null>(value)
  const [values, setValues] = useState<CatalogAttributeValueEntry[]>(attribute.values)
  const isEdit = Boolean(editingValue)
  const title = 'Add value'
  const idleSubmitLabel = isEdit ? 'Save changes' : 'Add value'
  const path = attributeValueCreateEmbedPath(kind, entityId, attribute.attributeId)
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path,
    title,
    description: attribute.name,
    submitLabel: null,
    cancelLabel: 'Close',
    ...ATTRIBUTE_VALUE_DIALOG_SIZE,
    onResult: () => {
      onSaved()
      onOpenChange(false)
    },
    onCancel: () => {
      onSaved()
      onOpenChange(false)
    },
  })

  const [textValue, setTextValue] = useState('')
  const [numberValue, setNumberValue] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pendingDeleteValue, setPendingDeleteValue] = useState<CatalogAttributeValueEntry | null>(
    null,
  )

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, saving, undefined, {
      description: attribute.name,
    })
  }, [attribute.name, chrome, dialogRequestId, parentOrigin, saving])

  useEffect(() => {
    if (!open) return
    setValues(attribute.values)
  }, [open, attribute.values])

  useEffect(() => {
    if (!open) return
    setError(null)
    setFieldError(null)
    setEditingValue(value)
    if (value) {
      setTextValue(value.valueText ?? '')
      setNumberValue(value.valueNumber != null ? String(value.valueNumber) : '')
    } else {
      setTextValue('')
      setNumberValue('')
    }
  }, [open, value])

  function applyItemValues(item: CatalogItem) {
    const found = item.attributes.find((entry) => entry.attributeId === attribute.attributeId)
    if (found) setValues(found.values)
  }

  function resetForm() {
    setEditingValue(null)
    setTextValue('')
    setNumberValue('')
    setFieldError(null)
    setError(null)
  }

  function startEdit(entry: CatalogAttributeValueEntry) {
    setEditingValue(entry)
    setTextValue(entry.valueText ?? '')
    setNumberValue(entry.valueNumber != null ? String(entry.valueNumber) : '')
    setFieldError(null)
    setError(null)
  }

  async function handleSubmit() {
    setError(null)
    setFieldError(null)

    if (attribute.valueType === 'number') {
      const parsed = catalogAttributeNumberValueSchema.safeParse({ value: numberValue })
      if (!parsed.success) {
        setFieldError(parsed.error.issues[0]?.message ?? 'Value is required')
        return
      }
      const number = Number(parsed.data.value)
      setSaving(true)
      try {
        const item =
          isEdit && editingValue
            ? await updateCatalogEntityAttributeValue(kind, entityId, editingValue.id, {
                value_number: number,
              })
            : await addCatalogEntityAttributeValue(kind, entityId, attribute.attributeId, {
                value_number: number,
              })
        applyItemValues(item)
        resetForm()
        onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save value')
      } finally {
        setSaving(false)
      }
      return
    }

    const parsed = catalogAttributeTextValueSchema.safeParse({ value: textValue })
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Value is required')
      return
    }
    setSaving(true)
    try {
      const item =
        isEdit && editingValue
          ? await updateCatalogEntityAttributeValue(kind, entityId, editingValue.id, {
              value_text: parsed.data.value,
            })
          : await addCatalogEntityAttributeValue(kind, entityId, attribute.attributeId, {
              value_text: parsed.data.value,
            })
      applyItemValues(item)
      resetForm()
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save value')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteValue(entry: CatalogAttributeValueEntry) {
    setSaving(true)
    setError(null)
    try {
      const item = await deleteCatalogEntityAttributeValue(kind, entityId, entry.id)
      applyItemValues(item)
      if (editingValue?.id === entry.id) resetForm()
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete value')
    } finally {
      setSaving(false)
      setPendingDeleteValue(null)
    }
  }

  async function handleSetDefault(entry: CatalogAttributeValueEntry) {
    if (entry.isDefault) return
    setSaving(true)
    setError(null)
    try {
      const item = await setCatalogEntityAttributeValueDefault(kind, entityId, entry.id)
      applyItemValues(item)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default value')
    } finally {
      setSaving(false)
    }
  }

  const unitSymbol = attribute.unit?.symbol?.trim() || null
  const unitLabel = attribute.unit
    ? `${attribute.unit.name}${unitSymbol ? ` (${unitSymbol})` : ''}`
    : null
  const hasFieldError = Boolean(fieldError)

  const actions = (
    <Button
      type="button"
      variant="outline"
      className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
      onClick={() => onOpenChange(false)}
      disabled={saving}
    >
      Close
    </Button>
  )

  const submitButton = (
    <Button
      type="button"
      className="h-10 shrink-0 px-4"
      onClick={() => void handleSubmit()}
      disabled={saving}
    >
      {isEdit ? (
        <Save className="mr-2 h-4 w-4" aria-hidden />
      ) : (
        <Plus className="mr-2 h-4 w-4" aria-hidden />
      )}
      {saving ? 'Saving…' : idleSubmitLabel}
    </Button>
  )

  const body = (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {attribute.valueType === 'number' ? (
        <FormField
          label="Value"
          htmlFor="attr-value-number"
          required
          error={fieldError ?? undefined}
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <InputGroup invalid={hasFieldError}>
                <Input
                  id="attr-value-number"
                  type="number"
                  inGroup
                  value={numberValue}
                  onChange={(e) => {
                    setNumberValue(e.target.value)
                    setFieldError(null)
                  }}
                  disabled={saving}
                  aria-invalid={hasFieldError || undefined}
                  aria-describedby={unitLabel ? 'attr-value-unit' : undefined}
                />
                {unitSymbol ? (
                  <InputGroupText
                    id="attr-value-unit"
                    title={unitLabel ?? unitSymbol}
                    className="ml-auto border-l border-r-0 border-input bg-transparent py-2 pl-3 pr-0"
                  >
                    {unitSymbol}
                  </InputGroupText>
                ) : null}
              </InputGroup>
            </div>
            {submitButton}
          </div>
        </FormField>
      ) : (
        <FormField
          label="Value"
          htmlFor="attr-value-text"
          required
          error={fieldError ?? undefined}
        >
          <div className="flex items-start gap-2">
            <Input
              id="attr-value-text"
              className="min-w-0 flex-1"
              value={textValue}
              onChange={(e) => {
                setTextValue(e.target.value)
                setFieldError(null)
              }}
              disabled={saving}
              aria-invalid={hasFieldError || undefined}
            />
            {submitButton}
          </div>
        </FormField>
      )}

      {isEdit ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={saving}
            onClick={() => resetForm()}
          >
            Cancel edit
          </Button>
        </div>
      ) : null}

      <div className="space-y-2 border-t border-[hsl(var(--glass-border))] pt-4">
        <p className="text-sm font-medium text-foreground">Existing values</p>
        {values.length === 0 ? (
          <ItemListEmpty>No values yet.</ItemListEmpty>
        ) : (
          <ItemList className="py-0">
            {values.map((entry) => {
              const label = formatCatalogAttributeEntry(attribute, entry)
              const isActive = editingValue?.id === entry.id
              return (
                <ItemListItem
                  key={entry.id}
                  className={isActive ? itemListRowActiveClassName : undefined}
                >
                  <ItemListContent>
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate font-medium">{label}</p>
                      {entry.isDefault ? (
                        <StatusTag variant="verified" className="shrink-0">
                          Default
                        </StatusTag>
                      ) : null}
                    </div>
                  </ItemListContent>
                  <ItemListMenu ariaLabel={`Actions for ${label}`}>
                    {!entry.isDefault ? (
                      <DropdownMenuItem
                        disabled={saving}
                        onClick={() => void handleSetDefault(entry)}
                      >
                        Set as default
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem
                      disabled={saving}
                      onClick={() => startEdit(entry)}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      disabled={saving}
                      onClick={() => setPendingDeleteValue(entry)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </ItemListMenu>
                </ItemListItem>
              )
            })}
          </ItemList>
        )}
      </div>
    </div>
  )

  const deleteConfirm = (
    <AlertDialog
      open={pendingDeleteValue !== null}
      onOpenChange={(next) => {
        if (!next) setPendingDeleteValue(null)
      }}
    >
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete value</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingDeleteValue
              ? `Delete value "${formatCatalogAttributeEntry(attribute, pendingDeleteValue)}" from ${attribute.name}?`
              : 'Delete this value?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={saving}
            onClick={(event) => {
              event.preventDefault()
              if (pendingDeleteValue) {
                void handleDeleteValue(pendingDeleteValue)
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  if (chrome === 'embed-page') {
    return (
      <>
        <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
        {deleteConfirm}
      </>
    )
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
        description={attribute.name}
        sizeWidth={ATTRIBUTE_VALUE_DIALOG_SIZE.sizeWidth}
        sizeHeight={ATTRIBUTE_VALUE_DIALOG_SIZE.sizeHeight}
        footer={actions}
      >
        {body}
      </CustomDialog>
      {deleteConfirm}
    </>
  )
}
