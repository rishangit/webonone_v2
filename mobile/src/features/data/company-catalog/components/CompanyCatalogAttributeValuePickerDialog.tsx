import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Check } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import {
  Button,
  CustomDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  useToast,
} from '@webonone/mobile-ui'
import { companyCatalogApi } from '@/features/data/services/companyCatalogApi'
import {
  dataLibraryApi,
  formatLibraryAttributeValueLabel,
  parseLibraryAttributes,
} from '@/features/sales/services/dataLibraryApi'
import type { CatalogKind } from '@/features/data/utils/dataPaths'

type LibraryValueOption = {
  id: string
  valueText: string | null
  valueNumber: number | null
}

export function CompanyCatalogAttributeValuePickerDialog({
  open,
  kind,
  entityId,
  attributeId,
  libraryEntityId,
  copiedLibraryValueIds,
  unitSymbol,
  onOpenChange,
  onCopied,
  onCreate,
}: {
  open: boolean
  kind: CatalogKind
  entityId: string
  attributeId: string
  libraryEntityId: string | null
  copiedLibraryValueIds: string[]
  unitSymbol: string | null
  onOpenChange: (open: boolean) => void
  onCopied: () => void
  onCreate: () => void
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [options, setOptions] = useState<LibraryValueOption[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !libraryEntityId) {
      setOptions([])
      return
    }
    let cancelled = false
    setLoading(true)
    setSelectedIds([])
    void dataLibraryApi
      .get(kind, libraryEntityId)
      .then((item) => {
        if (cancelled) return
        const copied = new Set(copiedLibraryValueIds)
        const attribute = parseLibraryAttributes(item.attributes).find(
          (entry) => entry.attributeId === attributeId,
        )
        setOptions((attribute?.values ?? []).filter((value) => !copied.has(value.id)))
      })
      .catch(() => {
        if (!cancelled) setOptions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [attributeId, copiedLibraryValueIds, kind, libraryEntityId, open])

  const visible = useMemo(() => options, [options])

  async function copySelected() {
    if (selectedIds.length === 0) return
    setSaving(true)
    try {
      await companyCatalogApi.copyAttributeValuesFromLibrary(kind, entityId, selectedIds)
      toast({ title: t('attributeDetail.valuesCopied') })
      onCopied()
      onOpenChange(false)
    } catch (err) {
      toast({
        title: t('attributeDetail.copyValuesFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('attributeDetail.addValue')}
      description={t('attributesTab.addDescription')}
      footer={
        <View className="flex-row flex-wrap justify-end gap-2">
          <Button variant="outline" onPress={() => onOpenChange(false)} disabled={saving}>
            {tc('cancel')}
          </Button>
          <Button variant="outline" onPress={onCreate} disabled={saving}>
            {t('attributeDetail.createValue')}
          </Button>
          <Button onPress={() => void copySelected()} disabled={saving || selectedIds.length === 0}>
            {t('attributeDetail.addSelectedValues', { count: selectedIds.length })}
          </Button>
        </View>
      }
    >
      {loading ? (
        <ItemListEmpty>{t('attributesTab.loading')}</ItemListEmpty>
      ) : visible.length === 0 ? (
        <ItemListEmpty>{t('attributeDetail.valuePickerEmpty')}</ItemListEmpty>
      ) : (
        <ItemList>
          {visible.map((value) => {
            const selected = selectedIds.includes(value.id)
            return (
              <ItemListItem key={value.id}>
                <Pressable
                  className="min-w-0 flex-1 flex-row items-center gap-2"
                  onPress={() =>
                    setSelectedIds((current) =>
                      current.includes(value.id)
                        ? current.filter((id) => id !== value.id)
                        : [...current, value.id],
                    )
                  }
                >
                  <ItemListContent title={formatLibraryAttributeValueLabel(value, unitSymbol)} />
                  {selected ? <Check size={20} /> : null}
                </Pressable>
              </ItemListItem>
            )
          })}
        </ItemList>
      )}
    </CustomDialog>
  )
}
