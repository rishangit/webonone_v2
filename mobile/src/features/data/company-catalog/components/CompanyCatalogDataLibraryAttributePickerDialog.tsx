import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { Check } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import {
  Button,
  CustomDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ListAddButton,
  ListPageActions,
  SearchInput,
  useToast,
} from '@webonone/mobile-ui'
import { AttributeFormDialog } from '@/features/data/components/AttributeFormDialog'
import { companyCatalogApi } from '@/features/data/services/companyCatalogApi'
import {
  dataLibraryApi,
  parseLibraryAttributeListItem,
  type LibraryAttributeListItem,
} from '@/features/sales/services/dataLibraryApi'
import type { CatalogKind } from '@/features/data/utils/dataPaths'

export function CompanyCatalogDataLibraryAttributePickerDialog({
  open,
  kind,
  entityId,
  excludedAttributeIds,
  onOpenChange,
  onAttached,
}: {
  open: boolean
  kind: CatalogKind
  entityId: string
  excludedAttributeIds: string[]
  onOpenChange: (open: boolean) => void
  onAttached: (libraryEntityId: string) => void
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<LibraryAttributeListItem[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const excludedKey = excludedAttributeIds.join(',')
  const excluded = useMemo(() => new Set(excludedKey ? excludedKey.split(',') : []), [excludedKey])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setSelectedIds([])
    let cancelled = false
    setLoading(true)
    void dataLibraryApi
      .list('attributes', { pageSize: 100 })
      .then((result) => {
        if (cancelled) return
        setItems(
          result.items
            .filter((item) => !excluded.has(item.id))
            .map(parseLibraryAttributeListItem),
        )
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [excluded, open])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false),
    )
  }, [items, query])

  async function attachIds(attributeIds: string[]) {
    const toAttach = attributeIds.filter((id) => !excluded.has(id))
    if (toAttach.length === 0) return
    setSaving(true)
    try {
      const result = await companyCatalogApi.attachAttributesToLibrary(kind, entityId, toAttach)
      toast({ title: t('attributesTab.attachedToLibrary') })
      onAttached(result.libraryEntityId)
      onOpenChange(false)
    } catch (err) {
      toast({
        title: t('attributesTab.attachFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  function toggle(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t('attributesTab.addToLibraryTitle')}
        description={t('attributesTab.addToLibraryDescription')}
        sizeWidth="medium"
        sizeHeight="large"
        nestedDismissGuard={createOpen}
        footer={
          <View className="flex-row flex-wrap justify-end gap-2">
            <Button variant="outline" onPress={() => onOpenChange(false)} disabled={saving}>
              {tc('cancel')}
            </Button>
            <Button
              disabled={saving || selectedIds.length === 0}
              onPress={() => void attachIds(selectedIds)}
            >
              {t('attributesTab.attachSelected', { count: selectedIds.length })}
            </Button>
          </View>
        }
      >
        <View className="gap-3">
          <ListPageActions>
            <SearchInput
              value={query}
              onChangeText={setQuery}
              onClear={() => setQuery('')}
              placeholder={t('attributesTab.search')}
              editable={!saving}
            />
            <ListAddButton disabled={saving} onPress={() => setCreateOpen(true)}>
              {t('attributesTab.addNewAttribute')}
            </ListAddButton>
          </ListPageActions>
          {loading ? (
            <ItemListEmpty>{t('attributesTab.loading')}</ItemListEmpty>
          ) : visible.length === 0 ? (
            <ItemListEmpty>{t('attributesTab.dataLibraryPickerEmpty')}</ItemListEmpty>
          ) : (
            <ItemList>
              {visible.map((item) => {
                const selected = selectedIds.includes(item.id)
                return (
                  <ItemListItem key={item.id} selected={selected} onPress={() => toggle(item.id)}>
                    <ItemListContent
                      title={item.name}
                      subtitle={[
                        item.description,
                        [
                          item.valueType === 'number'
                            ? t('attributesTab.valueTypeNumber')
                            : t('attributesTab.valueTypeText'),
                          item.unit
                            ? `${item.unit.name} (${item.unit.symbol})`
                            : t('attributesTab.noUnit'),
                        ].join(' · '),
                      ]
                        .filter(Boolean)
                        .join('\n')}
                    />
                    {selected ? <Check size={20} /> : null}
                  </ItemListItem>
                )
              })}
            </ItemList>
          )}
        </View>
      </CustomDialog>
      <AttributeFormDialog
        open={createOpen}
        canSetStatus={false}
        onOpenChange={setCreateOpen}
        onSaved={(attribute) => {
          setCreateOpen(false)
          void attachIds([attribute.id])
        }}
      />
    </>
  )
}
