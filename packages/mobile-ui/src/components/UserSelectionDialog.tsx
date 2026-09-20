import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { CustomDialog } from './CustomDialog'
import { Button } from './Button'
import { SearchInput } from './SearchInput'
import { ItemList, ItemListContent, ItemListEmpty, ItemListItem } from './ItemList'
import { Avatar, getAvatarInitials } from './Avatar'
import { StatusTag } from './StatusTag'
import type { SelectUserValue } from './SelectUser'

export type UserOption = SelectUserValue & {
  role?: string | null
}

export type UserSelectionLoadParams = {
  search: string
  page: number
  pageSize: number
}

export type UserSelectionLoadResult = {
  users: UserOption[]
  hasMore: boolean
}

export type LoadUsersFn = (params: UserSelectionLoadParams) => Promise<UserSelectionLoadResult>

export function UserSelectionDialog({
  open,
  onOpenChange,
  users,
  selectedId,
  onSelect,
  title = 'Select user',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: UserOption[]
  selectedId?: string | null
  onSelect: (user: UserOption) => void
  title?: string
}) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
    )
  }, [search, users])

  return (
    <CustomDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSearch('')
        onOpenChange(next)
      }}
      title={title}
      sizeWidth="large"
      sizeHeight="xlarge"
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
          placeholder="Search users"
        />
        {filtered.length === 0 ? <ItemListEmpty>No users match your search.</ItemListEmpty> : null}
        <ItemList>
          {filtered.map((user) => (
            <ItemListItem key={user.id} selected={selectedId === user.id}>
              <Pressable
                className="min-w-0 flex-1 flex-row items-center gap-3"
                onPress={() => {
                  onSelect(user)
                  onOpenChange(false)
                }}
              >
                <Avatar
                  size="sm"
                  src={user.avatarUrl}
                  fallback={getAvatarInitials(user.displayName)}
                  alt={user.displayName}
                />
                <ItemListContent title={user.displayName} subtitle={user.email} />
                {user.role ? <StatusTag variant={user.role} /> : null}
              </Pressable>
            </ItemListItem>
          ))}
        </ItemList>
      </View>
    </CustomDialog>
  )
}
