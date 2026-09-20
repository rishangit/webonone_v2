import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  CustomDialog,
  ItemList,
  ItemListEmpty,
  ItemListItem,
  SearchInput,
  Spinner,
} from '@webonone/mobile-ui'
import type { ProductAttributeRow } from '@/features/data/schemas/dataSchemas'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { Attribute } from '@/shared/types/data.types'

export function AttributePickerDialog({
  open,
  onOpenChange,
  selected,
  onDone,
  title,
  description,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selected: ProductAttributeRow[]
  onDone: (rows: ProductAttributeRow[]) => void
  title?: string
  description?: string
}) {
  const { t } = useTranslation('products')
  const { t: ta } = useTranslation('attributes')
  const { t: tc } = useTranslation('common')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<ProductAttributeRow[]>([])

  useEffect(() => {
    if (!open) return
    setPending(selected)
    setSearch('')
  }, [open, selected])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    void dataAdminApi
      .listAttributes({ q: search.trim() || undefined, pageSize: 200 })
      .then((result) => {
        if (!cancelled) setItems(result.items)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, search])

  const selectedIds = useMemo(() => new Set(pending.map((row) => row.attributeId)), [pending])

  function toggle(item: Attribute) {
    setPending((current) =>
      current.some((row) => row.attributeId === item.id)
        ? current.filter((row) => row.attributeId !== item.id)
        : [...current, { attributeId: item.id, name: item.name, valueType: item.valueType }],
    )
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title ?? t('selectAttributesTitle')}
      description={description ?? t('selectAttributesDescription')}
      sizeWidth="large"
      sizeHeight="large"
      stackLevel={1}
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button
            onPress={() => {
              onDone(pending)
              onOpenChange(false)
            }}
          >
            {tc('done')}
          </Button>
        </>
      }
    >
      <View className="gap-3">
        <SearchInput
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
          placeholder={ta('search')}
        />
        {loading ? <Spinner label={ta('loading')} /> : null}
        {!loading && items.length === 0 ? (
          <ItemListEmpty>{ta('emptyFound')}</ItemListEmpty>
        ) : null}
        <ItemList>
          {items.map((item) => (
            <ItemListItem key={item.id} selected={selectedIds.has(item.id)}>
              <Pressable className="min-w-0 flex-1" onPress={() => toggle(item)}>
                <Body>{item.name}</Body>
                <Body className="text-sm text-muted">{item.valueType}</Body>
              </Pressable>
            </ItemListItem>
          ))}
        </ItemList>
      </View>
    </CustomDialog>
  )
}
