import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { formatEventWhen } from '@/features/calendar/schemas/eventSchemas'
import { eventsActions } from '@/features/calendar/store'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import type { CompanyEvent } from '@/features/calendar/types/event.types'

type EventsListProps = {
  items: CompanyEvent[]
  onRemoved: () => void
}

export function EventsList({ items, onRemoved }: EventsListProps) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<CompanyEvent | null>(null)

  if (items.length === 0) {
    return <ItemListEmpty>No events yet. Add an event to get started.</ItemListEmpty>
  }

  function openDetails(id: string) {
    navigate(`/calendar/events/${id}`)
  }

  async function handleRemove(item: CompanyEvent) {
    setRemovingId(item.id)
    try {
      await eventsApi.delete(item.id)
      dispatch(eventsActions.deleteSucceeded(item.id))
      toast({ title: 'Event removed' })
      onRemoved()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove event'
      toast({ title: 'Failed to remove event', description: message, variant: 'destructive' })
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <>
      <ItemList>
        {items.map((item) => (
          <ItemListItem key={item.id}>
            <ItemListContent>
              <button
                type="button"
                className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => openDetails(item.id)}
              >
                <ImagePreview
                  src={item.serviceImageUrl}
                  alt={item.serviceName}
                  mode="view"
                  className="h-12 w-12"
                />
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium text-foreground">{item.serviceName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Staff: {item.staffDisplayName}
                    {item.attendeeDisplayName ? ` · Attendee: ${item.attendeeDisplayName}` : ''}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{formatEventWhen(item)}</p>
                </div>
              </button>
            </ItemListContent>
            <ItemListMenu ariaLabel={`Actions for ${item.serviceName}`}>
              <DropdownMenuItem onSelect={() => openDetails(item.id)}>View details</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={removingId === item.id}
                onSelect={() => setPendingRemove(item)}
                className="text-destructive focus:text-destructive"
              >
                {removingId === item.id ? 'Removing…' : 'Remove'}
              </DropdownMenuItem>
            </ItemListMenu>
          </ItemListItem>
        ))}
      </ItemList>
      <PlatformAlertConfirmDialog
        open={pendingRemove !== null}
        title={pendingRemove ? `Remove ${pendingRemove.serviceName}?` : 'Remove event?'}
        description="This action cannot be undone. The event will be permanently removed."
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel="Remove"
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
