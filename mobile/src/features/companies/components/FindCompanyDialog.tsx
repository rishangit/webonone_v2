import { useCallback, useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  Body,
  Button,
  CustomDialog,
  ImagePreview,
  ItemList,
  itemListThumbClassName,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  Muted,
  SearchInput,
  Spinner,
  useToast,
} from '@webonone/mobile-ui'
import { companyApi, type DiscoverCompanySummary } from '@/features/companies/services/companyApi'

const PAGE_SIZE = 12
const SEARCH_DEBOUNCE_MS = 300

function formatLocation(city: string | null, country: string | null): string | null {
  const parts = [city?.trim() || null, country?.trim() || null].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

export function FindCompanyDialog({
  open,
  onOpenChange,
  onConnected,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnected?: () => void
}) {
  const { toast } = useToast()
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [items, setItems] = useState<DiscoverCompanySummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectingId, setConnectingId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [open, searchInput])

  const load = useCallback(async () => {
    if (!open) return
    setLoading(true)
    setError(null)
    try {
      const result = await companyApi.searchDiscoverableCompanies({
        q: debouncedSearch,
        page: 1,
        pageSize: PAGE_SIZE,
      })
      setItems(result.items)
    } catch (err) {
      setItems([])
      setError(err instanceof Error ? err.message : 'Failed to load companies')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, open])

  useEffect(() => {
    if (!open) return
    void load()
  }, [load, open])

  useEffect(() => {
    if (!open) {
      setSearchInput('')
      setDebouncedSearch('')
      setItems([])
      setError(null)
      setConnectingId(null)
    }
  }, [open])

  async function handleConnect(company: DiscoverCompanySummary) {
    setConnectingId(company.id)
    try {
      await companyApi.connectCompany(company.id)
      toast({ title: `Connected to ${company.name}` })
      onOpenChange(false)
      onConnected?.()
    } catch (err) {
      toast({
        title: 'Could not connect',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setConnectingId(null)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Find companies"
      description="Search approved companies and connect as a member."
      sizeWidth="medium"
      sizeHeight="large"
      footer={
        <Button variant="outline" onPress={() => onOpenChange(false)}>
          Close
        </Button>
      }
    >
      <View className="gap-4">
        <SearchInput
          value={searchInput}
          onChangeText={setSearchInput}
          onClear={searchInput ? () => setSearchInput('') : undefined}
          placeholder="Company name"
          accessibilityLabel="Search companies"
        />

        {loading ? <Spinner label="Searching…" /> : null}
        {error ? <Body className="text-destructive">{error}</Body> : null}

        {!loading && items.length === 0 ? (
          <ItemListEmpty>No companies match your search.</ItemListEmpty>
        ) : null}

        {!loading && items.length > 0 ? (
          <ItemList>
            {items.map((item) => {
              const location = formatLocation(item.city, item.country)
              const subtitle = [location, item.contactEmail].filter(Boolean).join(' · ') || undefined

              return (
                <ItemListItem key={item.id}>
                  <Pressable className="min-w-0 flex-1 flex-row items-start gap-3">
                    <ImagePreview src={item.logoUrl} alt={item.name} className={itemListThumbClassName} />
                    <View className="min-w-0 flex-1 gap-2">
                      <ItemListContent title={item.name} subtitle={subtitle} />
                      {item.description ? (
                        <Muted className="text-sm">{item.description}</Muted>
                      ) : null}
                      <Button
                        size="sm"
                        loading={connectingId === item.id}
                        disabled={connectingId !== null && connectingId !== item.id}
                        onPress={() => void handleConnect(item)}
                      >
                        Connect
                      </Button>
                    </View>
                  </Pressable>
                </ItemListItem>
              )
            })}
          </ItemList>
        ) : null}
      </View>
    </CustomDialog>
  )
}
