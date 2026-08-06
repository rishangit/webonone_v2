import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  canManage?: boolean
  onRemoved: () => void
}

export function EventsList({ items, canManage = true, onRemoved }: EventsListProps) {
  const { t } = useTranslation('calendar')
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<CompanyEvent | null>(null)

  if (items.length === 0) {
    return (
      <ItemListEmpty>
        {canManage ? t('emptyEvents') : t('emptyBookings')}
      </ItemListEmpty>
    )
  }

  function openDetails(id: string) {
    navigate(`/calendar/events/${id}`)
  }

  async function handleRemove(item: CompanyEvent) {
    setRemovingId(item.id)
    try {
      await eventsApi.delete(item.id)
      dispatch(eventsActions.deleteSucceeded(item.id))
      toast({ title: t('eventRemoved') })
      onRemoved()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('eventRemoveFailed')
      toast({ title: t('eventRemoveFailed'), description: message, variant: 'destructive' })
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
                    {t('staffLabel', { name: item.staffDisplayName })}
                    {item.attendeeDisplayName
                      ? ` · ${t('attendeeLabel', { name: item.attendeeDisplayName })}`
                      : ''}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{formatEventWhen(item)}</p>
                </div>
              </button>
            </ItemListContent>
            <ItemListMenu ariaLabel={t('actionsFor', { name: item.serviceName })}>
              <DropdownMenuItem onSelect={() => openDetails(item.id)}>
                {t('viewDetails')}
              </DropdownMenuItem>
              {canManage ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={removingId === item.id}
                    onSelect={() => setPendingRemove(item)}
                    className="text-destructive focus:text-destructive"
                  >
                    {removingId === item.id ? t('removing') : t('common:remove')}
                  </DropdownMenuItem>
                </>
              ) : null}
            </ItemListMenu>
          </ItemListItem>
        ))}
      </ItemList>
      {canManage ? (
        <PlatformAlertConfirmDialog
          open={pendingRemove !== null}
          title={
            pendingRemove
              ? t('removeNamed', { name: pendingRemove.serviceName })
              : t('removeEvent')
          }
          description={t('removeEventConfirm')}
          isAllowedParentOrigin={isAllowedParentOrigin}
          submitLabel={t('common:remove')}
          onOpenChange={(open) => {
            if (!open) setPendingRemove(null)
          }}
          onConfirm={() => {
            if (pendingRemove) void handleRemove(pendingRemove)
          }}
        />
      ) : null}
    </>
  )
}
