import { Pressable, Text, View } from 'react-native'
import { ChevronDown, User } from 'lucide-react-native'
import { Avatar, getAvatarInitials } from './Avatar'
import { AvatarGroup, type AvatarGroupUser } from './AvatarGroup'
import { Body, Muted } from './Typography'
import { cn } from '../lib/cn'
import { controlPickerTriggerClassName } from '../lib/controlStyles'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'

export interface SelectUserValue {
  id: string
  displayName: string
  email: string
  avatarUrl?: string | null
}

export interface SelectUserProps {
  selectedUser?: SelectUserValue | null
  selectedUsers?: SelectUserValue[]
  multiple?: boolean
  placeholder?: string
  maxVisibleUsers?: number
  disabled?: boolean
  onPress?: () => void
}

function toAvatarUser(user: SelectUserValue): AvatarGroupUser {
  return {
    src: user.avatarUrl,
    fallback: getAvatarInitials(user.displayName),
    alt: user.displayName,
    name: user.displayName,
  }
}

export function SelectUser({
  selectedUser,
  selectedUsers = [],
  multiple = false,
  placeholder = 'Select user',
  maxVisibleUsers = 4,
  disabled,
  onPress,
}: SelectUserProps) {
  const users = multiple ? selectedUsers : selectedUser ? [selectedUser] : []
  const hasSelection = users.length > 0
  const iconColor = useThemedControlIconColor()

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={cn(
        controlPickerTriggerClassName,
        disabled && 'opacity-50',
      )}
    >
      {hasSelection ? (
        multiple ? (
          <>
            <AvatarGroup users={users.map(toAvatarUser)} size="sm" max={maxVisibleUsers} />
            <Muted className="flex-1">
              {users.length === 1 ? users[0]!.displayName : `${users.length} users selected`}
            </Muted>
          </>
        ) : (
          <>
            <Avatar
              size="sm"
              src={users[0]?.avatarUrl}
              fallback={getAvatarInitials(users[0]?.displayName ?? '')}
              alt={users[0]?.displayName}
            />
            <View className="min-w-0 flex-1">
              <Body className="font-medium" numberOfLines={1}>
                {users[0]?.displayName}
              </Body>
              <Muted numberOfLines={1}>{users[0]?.email}</Muted>
            </View>
          </>
        )
      ) : (
        <>
          <View className="h-8 w-8 shrink-0 items-center justify-center">
            <User size={20} color={iconColor} />
          </View>
          <Text className="flex-1 text-base text-muted">{placeholder}</Text>
        </>
      )}
      <ChevronDown size={20} color={iconColor} />
    </Pressable>
  )
}
