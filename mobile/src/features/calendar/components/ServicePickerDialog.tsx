import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  Body,
  CustomDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  SearchInput,
  Spinner,
} from '@webonone/mobile-ui'
import {
  formatEventServiceDescription,
  listCompanyEventServices,
} from '@/features/calendar/services/companyCatalogApi'
import type { EventServiceOption } from '@/features/calendar/schemas/eventSchemas'

type ServicePickerDialogProps = {
  open: boolean
  selectedId?: string | null
  onOpenChange: (open: boolean) => void
  onSelect: (service: EventServiceOption) => void
}

export function ServicePickerDialog({
  open,
  selectedId,
  onOpenChange,
  onSelect,
}: ServicePickerDialogProps) {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<EventServiceOption[]>([])

  useEffect(() => {
    if (!open) return
    setSearch('')
    let cancelled = false
    setLoading(true)
    void listCompanyEventServices()
      .then((result) => {
        if (!cancelled) setItems(result)
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
  }, [open])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return items
    return items.filter((item) => item.name.toLowerCase().includes(needle))
  }, [items, search])

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Select service"
      description="Choose a company catalog service for this event."
      sizeWidth="large"
      sizeHeight="xlarge"
      stackLevel={1}
    >
      <View className="gap-3">
        <SearchInput
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
          placeholder="Search services…"
        />
        {loading ? <Spinner label="Loading services…" /> : null}
        {!loading && filtered.length === 0 ? (
          <ItemListEmpty>No services found. Add a company service first.</ItemListEmpty>
        ) : null}
        {!loading ? (
          <ItemList>
            {filtered.map((item) => (
              <ItemListItem
                key={item.id}
                selected={selectedId === item.id}
                onPress={() => {
                  onSelect(item)
                  onOpenChange(false)
                }}
              >
                <ItemListContent title={item.name} subtitle={formatEventServiceDescription(item)} />
              </ItemListItem>
            ))}
          </ItemList>
        ) : null}
        {!loading && items.length > 0 ? (
          <Body className="text-xs text-muted">{items.length} services</Body>
        ) : null}
      </View>
    </CustomDialog>
  )
}
