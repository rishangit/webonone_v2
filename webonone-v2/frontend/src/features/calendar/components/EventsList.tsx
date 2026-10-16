import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  CollectionListView,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ImagePreview,
  ItemListCollectionCard,
  itemListCardImageClassName,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  itemListThumbClassName,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { WebononeCopyToAiMenuItem } from '@/features/ai/components/WebononeCopyToAiMenuItem'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { formatEventWhen } from '@/features/calendar/schemas/eventSchemas'
import { eventsActions } from '@/features/calendar/store'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import type { CompanyEvent } from '@/features/calendar/types/event.types'
import {
  overlayIdentityFromSessionUser,
  type SessionIdentityProfile,
} from '@/shared/utils/overlayIdentityFromSessionUser'

const ASSIGNED_USER_THUMB_CLASS = 'h-8 w-8 shrink-0 rounded-md'

type AssignedDurationUser = {
  displayName: string
  avatarUrl: string | null
}

/** Duration events show the assigned attendee. Specific-time token sessions do not. */
function assignedDurationUser(
  item: CompanyEvent,
  sessionUser: SessionIdentityProfile | null | undefined,
): AssignedDurationUser | null {
  if (item.timeMode !== 'duration') return null
  const overlaid = overlayIdentityFromSessionUser(item, sessionUser, {
    userId: 'attendeeUserId',
    displayName: 'attendeeDisplayName',
    avatarUrl: 'attendeeImageUrl',
  })
  const displayName = overlaid.attendeeDisplayName?.trim()
  if (!displayName) return null
  return { displayName, avatarUrl: overlaid.attendeeImageUrl }
}

type EventsListProps = {
  items: CompanyEvent[]
  canManage?: boolean
  emptyMessage?: string
  onRemoved: () => void
}

export function EventsList({
  items,
  canManage = true,
  emptyMessage,
  onRemoved,
}: EventsListProps) {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const sessionUser = useAppSelector((s) => s.auth.user)
  const { toast } = useToast()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<CompanyEvent | null>(null)

  const empty =
    emptyMessage ?? (canManage ? t('events.emptyAdmin') : t('events.emptyMember'))

  const openDetails = useCallback(
    (id: string) => {
      navigate(`/calendar/events/${id}`)
    },
    [navigate],
  )

  const columns = useMemo(
    () => [
      {
        id: 'service',
        header: t('events.columnService'),
        sortable: true,
        compare: (a: CompanyEvent, b: CompanyEvent) =>
          a.serviceName.localeCompare(b.serviceName, undefined, { sensitivity: 'base' }),
        cell: (item: CompanyEvent) => (
          <button
            type="button"
            className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => openDetails(item.id)}
          >
            {item.serviceName}
          </button>
        ),
      },
      {
        id: 'when',
        header: t('events.columnWhen'),
        sortable: true,
        compare: (a: CompanyEvent, b: CompanyEvent) =>
          `${a.startsOn}${a.startTime}`.localeCompare(`${b.startsOn}${b.startTime}`),
        cell: (item: CompanyEvent) => formatEventWhen(item),
      },
      {
        id: 'user',
        header: t('events.columnUser'),
        sortable: true,
        compare: (a: CompanyEvent, b: CompanyEvent) =>
          (assignedDurationUser(a, sessionUser)?.displayName ?? '').localeCompare(
            assignedDurationUser(b, sessionUser)?.displayName ?? '',
            undefined,
            { sensitivity: 'base' },
          ),
        cell: (item: CompanyEvent) => {
          const user = assignedDurationUser(item, sessionUser)
          if (!user) return '—'
          return (
            <span className="flex min-w-0 items-center gap-2">
              <ImagePreview
                src={user.avatarUrl}
                alt={user.displayName}
                mode="view"
                className={ASSIGNED_USER_THUMB_CLASS}
              />
              <span className="truncate">{user.displayName}</span>
            </span>
          )
        },
      },
    ],
    [openDetails, sessionUser, t],
  )

  async function handleRemove(item: CompanyEvent) {
    setRemovingId(item.id)
    try {
      await eventsApi.delete(item.id)
      dispatch(eventsActions.deleteSucceeded(item.id))
      toast({ title: t('events.toastRemoved') })
      onRemoved()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('events.toastRemoveFailed')
      toast({ title: t('events.toastRemoveFailed'), description: message, variant: 'destructive' })
    } finally {
      setRemovingId(null)
    }
  }

  function renderRowMenu(item: CompanyEvent) {
    return (
      <ItemListMenu ariaLabel={t('actionsFor', { name: item.serviceName })}>
        <DropdownMenuItem onSelect={() => openDetails(item.id)}>
          {t('events.viewDetails')}
        </DropdownMenuItem>
        <WebononeCopyToAiMenuItem kind="event" id={item.id} label={item.serviceName} />
        {canManage ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={removingId === item.id}
              onSelect={() => setPendingRemove(item)}
              className="text-destructive focus:text-destructive"
            >
              {removingId === item.id ? t('events.removing') : tc('remove')}
            </DropdownMenuItem>
          </>
        ) : null}
      </ItemListMenu>
    )
  }

  function eventDetails(item: CompanyEvent) {
    const user = assignedDurationUser(item, sessionUser)
    return (
      <div className="min-w-0 space-y-1">
        <p className="truncate font-medium text-foreground">{item.serviceName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {t('staffLabel', { name: item.staffDisplayName })}
        </p>
        {user ? (
          <div className="flex min-w-0 items-center gap-2">
            <ImagePreview
              src={user.avatarUrl}
              alt={user.displayName}
              mode="view"
              className={ASSIGNED_USER_THUMB_CLASS}
            />
            <p className="truncate text-xs text-foreground">{user.displayName}</p>
          </div>
        ) : null}
        <p className="truncate text-xs text-muted-foreground">{formatEventWhen(item)}</p>
      </div>
    )
  }

  function rowBody(item: CompanyEvent) {
    return (
      <div className="flex items-start gap-3">
        <ImagePreview
          src={item.serviceImageUrl}
          alt={item.serviceName}
          mode="view"
          className={itemListThumbClassName}
        />
        {eventDetails(item)}
      </div>
    )
  }

  return (
    <>
      <CollectionListView
        items={items}
        getRowKey={(item) => item.id}
        columns={columns}
        empty={<ItemListEmpty>{empty}</ItemListEmpty>}
        renderGridActions={renderRowMenu}
        renderListItem={(item) => (
          <ItemListItem>
            <ItemListContent>
              <button
                type="button"
                className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => openDetails(item.id)}
              >
                {rowBody(item)}
              </button>
            </ItemListContent>
            {renderRowMenu(item)}
          </ItemListItem>
        )}
        renderCard={(item) => (
          <ItemListCollectionCard
            image={
              <ImagePreview
                src={item.serviceImageUrl}
                alt={item.serviceName}
                mode="view"
                className={itemListCardImageClassName}
              />
            }
            menu={renderRowMenu(item)}
            onBodyClick={() => openDetails(item.id)}
          >
            {eventDetails(item)}
          </ItemListCollectionCard>
        )}
      />
      {canManage ? (
        <PlatformAlertConfirmDialog
          open={pendingRemove !== null}
          title={
            pendingRemove
              ? t('events.removeTitleNamed', { name: pendingRemove.serviceName })
              : t('events.removeTitle')
          }
          description={t('events.removeDescription')}
          isAllowedParentOrigin={isAllowedParentOrigin}
          submitLabel={tc('remove')}
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
