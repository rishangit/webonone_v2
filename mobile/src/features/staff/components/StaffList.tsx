import { useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  Avatar,
  Body,
  ConfirmDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  ItemListMenuSeparator,
  getAvatarInitials,
  itemListThumbClassName,
  useToast,
} from '@webonone/mobile-ui'
import { formatWorkingDaysSummary } from '@/features/staff/schemas/staffSchemas'
import { staffApi } from '@/features/staff/services/staffApi'
import type { CompanyStaff } from '@/features/staff/types/staff.types'

type StaffListProps = {
  items: CompanyStaff[]
  canManage?: boolean
  emptyMessage?: string
  onOpen: (staffId: string) => void
  onRemoved: () => void
}

export function StaffList({
  items,
  canManage = false,
  emptyMessage = 'No staff yet.',
  onOpen,
  onRemoved,
}: StaffListProps) {
  const { toast } = useToast()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<CompanyStaff | null>(null)

  if (items.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  async function handleRemove(item: CompanyStaff) {
    setRemovingId(item.id)
    try {
      await staffApi.delete(item.id)
      toast({ title: 'Staff member removed' })
      onRemoved()
    } catch (err) {
      toast({
        title: 'Could not remove staff',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setRemovingId(null)
      setPendingRemove(null)
    }
  }

  return (
    <>
      <ItemList>
        {items.map((item) => (
          <ItemListItem key={item.id}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onOpen(item.id)}
              className="min-w-0 flex-1 flex-row items-start gap-3"
            >
              <Avatar
                src={item.avatarUrl}
                fallback={getAvatarInitials(item.displayName)}
                alt={item.displayName}
                size="md"
                className={itemListThumbClassName}
              />
              <View className="min-w-0 flex-1 gap-1">
                <ItemListContent
                  title={item.displayName}
                  subtitle={item.email?.trim() || 'No email'}
                />
                <Body className="text-xs text-muted">{formatWorkingDaysSummary(item.schedule)}</Body>
              </View>
            </Pressable>
            <ItemListMenu ariaLabel={`Actions for ${item.displayName}`}>
              <ItemListMenuItem onPress={() => onOpen(item.id)}>View details</ItemListMenuItem>
              {canManage ? (
                <>
                  <ItemListMenuSeparator />
                  <ItemListMenuItem
                    destructive
                    disabled={removingId === item.id}
                    onPress={() => setPendingRemove(item)}
                  >
                    {removingId === item.id ? 'Removing…' : 'Remove'}
                  </ItemListMenuItem>
                </>
              ) : null}
            </ItemListMenu>
          </ItemListItem>
        ))}
      </ItemList>

      <ConfirmDialog
        open={pendingRemove !== null}
        title={pendingRemove ? `Remove ${pendingRemove.displayName}?` : 'Remove staff?'}
        description="This removes the staff member from your company schedule."
        confirmLabel="Remove"
        destructive
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null)
        }}
        onConfirm={() => {
          if (pendingRemove) void handleRemove(pendingRemove)
        }}
      />
    </>
  )
}
