import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  Button,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import {
  AttributeSelectStackedDialogs,
  type AttributeSelectValue,
} from '@/features/attributes/components/AttributeSelectField'
import { CatalogAttributeValueDialog } from '@/features/catalog/components/CatalogAttributeValueDialog'
import {
  type CatalogEntityKind,
  replaceCatalogEntityAttributes,
} from '@/features/catalog/utils/catalogAttributeApi'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { CatalogAttributeValue } from '@/shared/types/data.types'

type CatalogAttributesTabProps = {
  kind: CatalogEntityKind
  entityId: string
  attributes: CatalogAttributeValue[]
  canEdit: boolean
  onChanged: () => void
}

export function CatalogAttributesTab({
  kind,
  entityId,
  attributes,
  canEdit,
  onChanged,
}: CatalogAttributesTabProps) {
  const { t } = useTranslation(kind)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [valueDialogAttributeId, setValueDialogAttributeId] = useState<string | null>(null)
  const [pendingRemoveAttribute, setPendingRemoveAttribute] = useState<CatalogAttributeValue | null>(
    null,
  )
  const [busy, setBusy] = useState(false)

  const alreadySelected: AttributeSelectValue[] = attributes.map((attr) => ({
    id: attr.attributeId,
    name: attr.name,
    valueType: attr.valueType,
    unit: attr.unit,
  }))

  const valueDialogAttribute =
    valueDialogAttributeId == null
      ? null
      : (attributes.find((attr) => attr.attributeId === valueDialogAttributeId) ?? null)

  const closePicker = useCallback(() => {
    setPickerOpen(false)
  }, [])

  async function handleAddAttributes(selected: AttributeSelectValue[]) {
    if (selected.length === 0) {
      closePicker()
      return
    }
    const nextIds = [
      ...new Set([...attributes.map((attr) => attr.attributeId), ...selected.map((attr) => attr.id)]),
    ]
    setBusy(true)
    try {
      await replaceCatalogEntityAttributes(kind, entityId, nextIds)
      onChanged()
      closePicker()
    } catch {
      /* keep picker open; toast optional later */
    } finally {
      setBusy(false)
    }
  }

  async function handleRemoveAttribute(attribute: CatalogAttributeValue) {
    const nextIds = attributes
      .map((attr) => attr.attributeId)
      .filter((id) => id !== attribute.attributeId)
    setBusy(true)
    try {
      await replaceCatalogEntityAttributes(kind, entityId, nextIds)
      onChanged()
    } finally {
      setBusy(false)
      setPendingRemoveAttribute(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium text-foreground">{t('catalog.attributesTitle')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('catalog.attributesDescription')}
          </p>
        </div>
        {canEdit ? (
          <Button
            type="button"
            size="sm"
            onClick={() => setPickerOpen(true)}
            disabled={busy}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('catalog.addAttribute')}
          </Button>
        ) : null}
      </div>

      {attributes.length === 0 ? (
        <ItemListEmpty>{t('catalog.noAttributes')}</ItemListEmpty>
      ) : (
        <ItemList>
          {attributes.map((attr) => (
            <ItemListItem key={attr.attributeId}>
              <ItemListContent>
                <p className="truncate font-medium">{attr.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  <span className="capitalize">{attr.valueType}</span>
                  {attr.unit ? ` · ${attr.unit.name} (${attr.unit.symbol})` : ''}
                  {` · ${t('catalog.valueCount', { count: attr.values.length })}`}
                </p>
              </ItemListContent>
              {canEdit ? (
                <ItemListMenu ariaLabel={t('actionsFor', { name: attr.name })}>
                  <DropdownMenuItem
                    disabled={busy}
                    onClick={() => setValueDialogAttributeId(attr.attributeId)}
                  >
                    {t('catalog.addValue')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    disabled={busy}
                    onClick={() => setPendingRemoveAttribute(attr)}
                  >
                    {t('catalog.removeAttribute')}
                  </DropdownMenuItem>
                </ItemListMenu>
              ) : null}
            </ItemListItem>
          ))}
        </ItemList>
      )}

      <AttributeSelectStackedDialogs
        pickerOpen={pickerOpen}
        alreadySelectedAttributes={alreadySelected}
        onDone={(selected) => {
          void handleAddAttributes(selected)
        }}
        onClosePicker={closePicker}
        pickerStackLevel={0}
      />

      {valueDialogAttribute ? (
        <CatalogAttributeValueDialog
          open
          kind={kind}
          entityId={entityId}
          attribute={valueDialogAttribute}
          onOpenChange={(open) => {
            if (!open) {
              onChanged()
              setValueDialogAttributeId(null)
            }
          }}
          onSaved={onChanged}
        />
      ) : null}

      <PlatformAlertConfirmDialog
        open={pendingRemoveAttribute !== null}
        title={
          pendingRemoveAttribute
            ? t('catalog.removeAttributeConfirm', { name: pendingRemoveAttribute.name })
            : t('catalog.removeAttributeFallback')
        }
        description={t('catalog.removeAttributeDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={t('common:remove')}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveAttribute(null)
        }}
        onConfirm={() => {
          if (pendingRemoveAttribute) {
            void handleRemoveAttribute(pendingRemoveAttribute)
          }
        }}
      />
    </div>
  )
}
