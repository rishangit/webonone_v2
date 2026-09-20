import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { CustomDialog } from './CustomDialog'
import { Button } from './Button'
import { SearchInput } from './SearchInput'
import { ItemList, ItemListEmpty, ItemListItem } from './ItemList'
import { TagChip } from './TagChip'
import { Body } from './Typography'
import type { SelectTagValue } from './SelectTag'

export function TagSelectionDialog({
  open,
  onOpenChange,
  tags,
  selectedId,
  onSelect,
  title = 'Select tag',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tags: SelectTagValue[]
  selectedId?: string | null
  onSelect: (tag: SelectTagValue) => void
  title?: string
}) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return tags
    return tags.filter((tag) => tag.name.toLowerCase().includes(query))
  }, [search, tags])

  return (
    <CustomDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSearch('')
        onOpenChange(next)
      }}
      title={title}
      sizeWidth="medium"
      sizeHeight="large"
      footer={
        <Button variant="outline" onPress={() => onOpenChange(false)}>
          Cancel
        </Button>
      }
    >
      <View className="gap-3">
        <SearchInput
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
          placeholder="Search tags"
        />
        {filtered.length === 0 ? <ItemListEmpty>No tags match your search.</ItemListEmpty> : null}
        <ItemList>
          {filtered.map((tag) => (
            <ItemListItem key={tag.id} selected={selectedId === tag.id}>
              <Pressable
                className="min-w-0 flex-1"
                onPress={() => {
                  onSelect(tag)
                  onOpenChange(false)
                }}
              >
                <TagChip name={tag.name} color={tag.color} />
                <Body className="mt-1 text-sm text-muted">{tag.color}</Body>
              </Pressable>
            </ItemListItem>
          ))}
        </ItemList>
      </View>
    </CustomDialog>
  )
}
