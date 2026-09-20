import { useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  ConfirmDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  useToast,
} from '@webonone/mobile-ui'
import { AttributePickerDialog } from '@/features/data/components/AttributePickerDialog'
import { replaceCatalogAttributes } from '@/features/data/services/catalogEntityApi'
import type { CatalogKind } from '@/features/data/utils/dataPaths'
import type { CatalogAttributeValue, CatalogItem } from '@/shared/types/data.types'

export function CatalogAttributesTab({
  kind,
  entityId,
  attributes,
  canEdit,
  onSaved,
}: {
  kind: CatalogKind
  entityId: string
  attributes: CatalogAttributeValue[]
  canEdit: boolean
  onSaved: (item: CatalogItem) => void
}) {
  const { t } = useTranslation(kind)
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<CatalogAttributeValue | null>(null)
  const [busy, setBusy] = useState(false)

  async function persistAttributeIds(nextIds: string[]) {
    setBusy(true)
    try {
      const updated = await replaceCatalogAttributes(kind, entityId, nextIds)
      onSaved(updated)
    } catch (err) {
      toast({
        title: t('catalog.saveValueFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <View className="gap-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Body className="text-lg font-medium">{t('catalog.attributesTitle')}</Body>
          <Body className="text-sm text-muted">{t('catalog.attributesDescription')}</Body>
        </View>
        {canEdit ? (
          <Button size="sm" onPress={() => setPickerOpen(true)} disabled={busy}>
            {t('catalog.addAttribute')}
          </Button>
        ) : null}
      </View>

      {attributes.length === 0 ? (
        <ItemListEmpty>{t('catalog.noAttributes')}</ItemListEmpty>
      ) : (
        <ItemList>
          {attributes.map((attr) => {
            const unitPart = attr.unit ? ` · ${attr.unit.name} (${attr.unit.symbol})` : ''
            return (
              <ItemListItem key={attr.attributeId}>
                <ItemListContent
                  title={attr.name}
                  subtitle={`${attr.valueType}${unitPart} · ${t('catalog.valueCount', { count: attr.values.length })}`}
                />
                {canEdit ? (
                  <ItemListMenu ariaLabel={t('actionsFor', { name: attr.name })}>
                    <ItemListMenuItem
                      destructive
                      disabled={busy}
                      onPress={() => setPendingRemove(attr)}
                    >
                      {t('catalog.removeAttribute')}
                    </ItemListMenuItem>
                  </ItemListMenu>
                ) : null}
              </ItemListItem>
            )
          })}
        </ItemList>
      )}

      <AttributePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selected={attributes.map((attr) => ({
          attributeId: attr.attributeId,
          name: attr.name,
          valueType: attr.valueType,
        }))}
        onDone={(rows) => {
          void persistAttributeIds(rows.map((row) => row.attributeId))
        }}
      />

      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null)
        }}
        title={
          pendingRemove
            ? t('catalog.removeAttributeConfirm', { name: pendingRemove.name })
            : t('catalog.removeAttributeFallback')
        }
        description={t('catalog.removeAttributeDescription')}
        confirmLabel={tc('remove')}
        destructive
        busy={busy}
        onConfirm={() => {
          if (!pendingRemove) return
          const nextIds = attributes
            .map((attr) => attr.attributeId)
            .filter((id) => id !== pendingRemove.attributeId)
          setPendingRemove(null)
          void persistAttributeIds(nextIds)
        }}
      />
    </View>
  )
}
