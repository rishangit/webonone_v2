import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  Body,
  Button,
  CustomDialog,
  ItemList,
  ItemListEmpty,
  ItemListItem,
  SearchInput,
  Spinner,
  TagChip,
  type SelectTagValue,
} from '@webonone/mobile-ui'
import { listCatalogTags } from '@/features/companies/services/dataTagsApi'

export function CompanyTagMultiSelectionDialog({
  open,
  onOpenChange,
  selectedTags,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTags: SelectTagValue[]
  onDone: (tags: SelectTagValue[]) => void
}) {
  const [search, setSearch] = useState('')
  const [tags, setTags] = useState<SelectTagValue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<SelectTagValue[]>([])

  useEffect(() => {
    if (!open) return
    setPending(selectedTags)
    setSearch('')
  }, [open, selectedTags])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void listCatalogTags({ search })
      .then((items) => {
        if (!cancelled) setTags(items)
      })
      .catch((err) => {
        if (!cancelled) {
          setTags([])
          setError(err instanceof Error ? err.message : 'Failed to load tags')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, search])

  const selectedIds = useMemo(() => new Set(pending.map((tag) => tag.id)), [pending])

  function toggleTag(tag: SelectTagValue) {
    setPending((current) =>
      current.some((item) => item.id === tag.id)
        ? current.filter((item) => item.id !== tag.id)
        : [...current, tag],
    )
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Select tags"
      description="Choose one or more catalog tags, then tap Done."
      sizeWidth="large"
      sizeHeight="xlarge"
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>Cancel</Button>
          <Button onPress={() => {
            onDone(pending)
            onOpenChange(false)
          }}>
            Done{pending.length > 0 ? ` (${pending.length})` : ''}
          </Button>
        </>
      }
    >
      <View className="gap-3">
        <SearchInput
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
          placeholder="Search tags"
        />
        {loading ? <Spinner label="Loading tags…" /> : null}
        {error ? <Body className="text-destructive">{error}</Body> : null}
        {!loading && tags.length === 0 ? <ItemListEmpty>No tags match your search.</ItemListEmpty> : null}
        <ItemList>
          {tags.map((tag) => (
            <ItemListItem key={tag.id} selected={selectedIds.has(tag.id)}>
              <Pressable className="min-w-0 flex-1 gap-1" onPress={() => toggleTag(tag)}>
                <TagChip name={tag.name} color={tag.color} />
                <Body className="text-sm text-muted">{selectedIds.has(tag.id) ? 'Selected' : 'Tap to select'}</Body>
              </Pressable>
            </ItemListItem>
          ))}
        </ItemList>
      </View>
    </CustomDialog>
  )
}
