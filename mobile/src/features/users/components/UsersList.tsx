import { Pressable, View } from 'react-native'
import {
  Avatar,
  Badge,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  Muted,
  StatusTag,
  getAvatarInitials,
  isStatusTagVariant,
  itemListThumbClassName,
} from '@webonone/mobile-ui'
import type { UserPickerUser } from '@/features/users/types/users.types'

function formatRoleLabel(role: string): string {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

type UsersListProps = {
  items: UserPickerUser[]
  emptyMessage: string
  onOpen: (userId: string) => void
}

export function UsersList({ items, emptyMessage, onOpen }: UsersListProps) {
  if (items.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  return (
    <ItemList>
      {items.map((user) => {
        const emailLine = user.email?.trim() || 'No email'
        const subtitle = user.phoneNumber?.trim()
          ? `${emailLine} · ${user.phoneNumber}`
          : emailLine

        return (
          <ItemListItem key={user.id}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onOpen(user.id)}
              className="min-w-0 flex-1 flex-row items-start gap-3"
            >
              <Avatar
                src={user.avatarUrl}
                fallback={getAvatarInitials(user.displayName)}
                alt={user.displayName}
                size="md"
                className={itemListThumbClassName}
              />
              <View className="min-w-0 flex-1 gap-1">
                <ItemListContent title={user.displayName} subtitle={subtitle} />
                <View className="flex-row flex-wrap items-center gap-1.5">
                  {user.email?.trim() ? (
                    <Badge tone={user.isEmailVerified ? 'success' : 'neutral'}>
                      {user.isEmailVerified ? 'Email verified' : 'Email unverified'}
                    </Badge>
                  ) : null}
                  {user.phoneNumber?.trim() ? (
                    <Badge tone={user.isPhoneVerified ? 'success' : 'neutral'}>
                      {user.isPhoneVerified ? 'Phone verified' : 'Phone unverified'}
                    </Badge>
                  ) : null}
                </View>
              </View>
              {user.role ? (
                isStatusTagVariant(user.role) ? (
                  <StatusTag variant={user.role} />
                ) : (
                  <StatusTag variant="member">{formatRoleLabel(user.role)}</StatusTag>
                )
              ) : null}
            </Pressable>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}
