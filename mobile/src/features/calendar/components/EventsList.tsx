import { useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  ConfirmDialog,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  ItemListMenuSeparator,
  itemListThumbClassName,
  useToast,
} from '@webonone/mobile-ui'
import { formatEventWhen } from '@/features/calendar/schemas/eventSchemas'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import type { CompanyEvent } from '@/features/calendar/types/event.types'

type EventsListProps = {
  items: CompanyEvent[]
  canManage?: boolean
  emptyMessage?: string
  onOpen: (id: string) => void
  onRemoved: () => void
}

export function EventsList({
  items,
  canManage = false,
  emptyMessage = 'No events yet.',
  onOpen,
  onRemoved,
}: EventsListProps) {
  const { toast } = useToast()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<CompanyEvent | null>(null)

  if (items.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  async function handleRemove(item: CompanyEvent) {
    setRemovingId(item.id)
    try {
      await eventsApi.delete(item.id)
      toast({ title: 'Event removed' })
      onRemoved()
    } catch (err) {
      toast({
        title: 'Failed to remove event',
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
              <ImagePreview
                src={item.serviceImageUrl}
                alt={item.serviceName}
                className={itemListThumbClassName}
              />
              <View className="min-w-0 flex-1">
                <ItemListContent
                  title={item.serviceName}
                  subtitle={[
                    item.staffDisplayName,
                    item.attendeeDisplayName ? item.attendeeDisplayName : null,
                    formatEventWhen(item),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                />
              </View>
            </Pressable>
            <ItemListMenu ariaLabel={`Actions for ${item.serviceName}`}>
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
        title={pendingRemove ? `Remove ${pendingRemove.serviceName}?` : 'Remove event?'}
        description="This action cannot be undone. The event will be permanently removed."
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
