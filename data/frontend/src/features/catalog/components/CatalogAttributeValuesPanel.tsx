import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Save } from 'lucide-react'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Button,
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
import type {
  CatalogAttributeValue,
  CatalogAttributeValueEntry,
  CatalogItem,
} from '@/shared/types/data.types'

type CatalogAttributeValuesPanelProps = {
  kind: CatalogEntityKind
  entityId: string
  attribute: CatalogAttributeValue
  canEdit: boolean
  active?: boolean
  /** When false, hide the inline add/edit form (e.g. detail page opens CatalogAttributeValueDialog). */
  showAddForm?: boolean
  initialEditingValue?: CatalogAttributeValueEntry | null
  onRequestEdit?: (entry: CatalogAttributeValueEntry) => void
  onChanged: () => void
  onSavingChange?: (saving: boolean) => void
}

export function CatalogAttributeValuesPanel({
  kind,
  entityId,
  attribute,
  canEdit,
  active = true,
  showAddForm = true,
  initialEditingValue = null,
  onRequestEdit,
  onChanged,
  onSavingChange,
}: CatalogAttributeValuesPanelProps) {
  const { t } = useTranslation(kind)
  const [editingValue, setEditingValue] = useState<CatalogAttributeValueEntry | null>(
    initialEditingValue,
  )
  const [values, setValues] = useState<CatalogAttributeValueEntry[]>(attribute.values)
  const isEdit = Boolean(editingValue)
  const [textValue, setTextValue] = useState('')
  const [numberValue, setNumberValue] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pendingDeleteValue, setPendingDeleteValue] = useState<CatalogAttributeValueEntry | null>(
    null,
  )

  useEffect(() => {
    onSavingChange?.(saving)
  }, [onSavingChange, saving])

  useEffect(() => {
    if (!active) return
    setValues(attribute.values)
  }, [active, attribute.values])

  useEffect(() => {
    if (!active) return
    setError(null)
    setFieldError(null)
    setEditingValue(initialEditingValue)
    if (initialEditingValue) {
      setTextValue(initialEditingValue.valueText ?? '')
      setNumberValue(
        initialEditingValue.valueNumber != null ? String(initialEditingValue.valueNumber) : '',
      )
    } else {
      setTextValue('')
      setNumberValue('')
    }
  }, [active, initialEditingValue])

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
        setFieldError(parsed.error.issues[0]?.message ?? t('catalog.valueRequired'))
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
        onChanged()
      } catch (err) {
        setError(err instanceof Error ? err.message : t('catalog.saveValueFailed'))
      } finally {
        setSaving(false)
      }
      return
    }

    const parsed = catalogAttributeTextValueSchema.safeParse({ value: textValue })
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? t('catalog.valueRequired'))
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
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('catalog.saveValueFailed'))
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
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('catalog.deleteValueFailed'))
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
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('catalog.setDefaultFailed'))
    } finally {
      setSaving(false)
    }
  }

  const unitSymbol = attribute.unit?.symbol?.trim() || null
  const unitLabel = attribute.unit
    ? `${attribute.unit.name}${unitSymbol ? ` (${unitSymbol})` : ''}`
    : null
  const hasFieldError = Boolean(fieldError)
  const idleSubmitLabel = isEdit ? t('catalog.saveChanges') : t('catalog.addValue')

  const submitButton = canEdit ? (
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
      {saving ? t('common:saving') : idleSubmitLabel}
    </Button>
  ) : null

  return (
    <>
      <div className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {canEdit && showAddForm ? (
          attribute.valueType === 'number' ? (
            <FormField
              label={t('catalog.valueLabel')}
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
              label={t('catalog.valueLabel')}
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
          )
        ) : null}

        {canEdit && showAddForm && isEdit ? (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={() => resetForm()}
            >
              {t('catalog.cancelEdit')}
            </Button>
          </div>
        ) : null}

        <div
          className={
            showAddForm
              ? 'space-y-2 border-t border-[hsl(var(--glass-border))] pt-4'
              : 'space-y-2'
          }
        >
          <p className="text-sm font-medium text-foreground">{t('catalog.existingValues')}</p>
          {values.length === 0 ? (
            <ItemListEmpty>{t('catalog.noValuesYet')}</ItemListEmpty>
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
                            {t('catalog.defaultValue')}
                          </StatusTag>
                        ) : null}
                      </div>
                    </ItemListContent>
                    {canEdit ? (
                      <ItemListMenu ariaLabel={t('catalog.actionsForValue', { label })}>
                        {!entry.isDefault ? (
                          <DropdownMenuItem
                            disabled={saving}
                            onClick={() => void handleSetDefault(entry)}
                          >
                            {t('catalog.setAsDefault')}
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          disabled={saving}
                          onClick={() =>
                            onRequestEdit ? onRequestEdit(entry) : startEdit(entry)
                          }
                        >
                          {t('common:edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          disabled={saving}
                          onClick={() => setPendingDeleteValue(entry)}
                        >
                          {t('common:delete')}
                        </DropdownMenuItem>
                      </ItemListMenu>
                    ) : null}
                  </ItemListItem>
                )
              })}
            </ItemList>
          )}
        </div>
      </div>

      <PlatformAlertConfirmDialog
        open={pendingDeleteValue !== null}
        title={
          pendingDeleteValue
            ? t('catalog.deleteValueConfirm', {
                value: formatCatalogAttributeEntry(attribute, pendingDeleteValue),
              })
            : t('catalog.deleteValueFallback')
        }
        description={t('catalog.deleteValueDescription', { name: attribute.name })}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={t('common:delete')}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteValue(null)
        }}
        onConfirm={() => {
          if (pendingDeleteValue) {
            void handleDeleteValue(pendingDeleteValue)
          }
        }}
      />
    </>
  )
}
