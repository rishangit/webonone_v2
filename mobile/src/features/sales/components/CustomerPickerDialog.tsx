import { useCallback, useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  Avatar,
  Body,
  Button,
  CustomDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  SearchInput,
  Spinner,
  getAvatarInitials,
} from '@webonone/mobile-ui'
import {
  customersApi,
  type CustomerOption,
} from '@/features/sales/services/customersApi'

type CustomerPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedId?: string | null
  onSelect: (customer: CustomerOption) => void
  onAddNew?: () => void
}

export function CustomerPickerDialog({
  open,
  onOpenChange,
  selectedId,
  onSelect,
  onAddNew,
}: CustomerPickerDialogProps) {
  const [search, setSearch] = useState('')
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (query: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await customersApi.loadForSelection({
        search: query,
        page: 1,
        pageSize: 50,
      })
      setCustomers(result.users)
    } catch (err) {
      setCustomers([])
      setError(err instanceof Error ? err.message : 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setSearch('')
      return
    }
    const handle = setTimeout(() => {
      void load(search)
    }, 300)
    return () => clearTimeout(handle)
  }, [load, open, search])

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Select customer"
      description="Choose a company customer for this sale."
      sizeWidth="large"
      sizeHeight="xlarge"
      footer={
        <View className="flex-row flex-wrap justify-end gap-2">
          {onAddNew ? (
            <Button variant="outline" onPress={onAddNew}>New customer</Button>
          ) : null}
          <Button variant="outline" onPress={() => onOpenChange(false)}>Cancel</Button>
        </View>
      }
    >
      <View className="gap-3">
        <SearchInput
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
          placeholder="Search customers"
          accessibilityLabel="Search customers"
        />
        {loading ? <Spinner label="Loading customers…" /> : null}
        {error ? <Body className="text-destructive">{error}</Body> : null}
        {!loading && customers.length === 0 ? (
          <ItemListEmpty>No customers found.</ItemListEmpty>
        ) : null}
        {!loading && customers.length > 0 ? (
          <ItemList>
            {customers.map((customer) => (
              <ItemListItem key={customer.id} selected={selectedId === customer.id}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    onSelect(customer)
                    onOpenChange(false)
                  }}
                  className="flex-1 flex-row items-center gap-3"
                >
                  <Avatar
                    src={customer.avatarUrl ?? undefined}
                    fallback={getAvatarInitials(customer.displayName)}
                    size="sm"
                  />
                  <ItemListContent title={customer.displayName} subtitle={customer.email ?? undefined} />
                </Pressable>
              </ItemListItem>
            ))}
          </ItemList>
        ) : null}
      </View>
    </CustomDialog>
  )
}
