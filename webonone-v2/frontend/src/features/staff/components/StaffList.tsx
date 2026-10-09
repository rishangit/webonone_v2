import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  CollectionListView,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ContactValueLine,
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
import { useAppDispatch } from '@/app/store/hooks'
import { WebononeCopyToAiMenuItem } from '@/features/ai/components/WebononeCopyToAiMenuItem'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { formatWorkingDaysSummary } from '@/features/staff/schemas/staffSchemas'
import { staffActions } from '@/features/staff/store'
import { staffApi } from '@/features/staff/services/staffApi'
import type { CompanyStaff } from '@/features/staff/types/staff.types'

type StaffListProps = {
  items: CompanyStaff[]
  canManage?: boolean
  onRemoved: () => void
}

export function StaffList({ items, canManage = false, onRemoved }: StaffListProps) {
  const { t } = useTranslation('staff')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<CompanyStaff | null>(null)

  function openDetails(id: string) {
    navigate(`/staff/${id}`)
  }

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: tc('name'),
        sortable: true,
        compare: (a: CompanyStaff, b: CompanyStaff) =>
          a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }),
        cell: (item: CompanyStaff) => (
          <button
            type="button"
            className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => openDetails(item.id)}
          >
            {item.displayName}
          </button>
        ),
      },
      {
        id: 'email',
        header: t('list.columnEmail'),
        cell: (item: CompanyStaff) => item.email ?? '—',
      },
      {
        id: 'schedule',
        header: t('list.columnSchedule'),
        cell: (item: CompanyStaff) => formatWorkingDaysSummary(item.schedule),
      },
    ],
    [t, tc],
  )

  async function handleRemove(item: CompanyStaff) {
    setRemovingId(item.id)
    try {
      await staffApi.delete(item.id)
      dispatch(staffActions.deleteSucceeded(item.id))
      toast({ title: t('list.toastRemoved') })
      onRemoved()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('list.toastRemoveFailed')
      toast({ title: t('list.toastRemoveFailed'), description: message, variant: 'destructive' })
    } finally {
      setRemovingId(null)
    }
  }

  function renderRowMenu(item: CompanyStaff) {
    return (
      <ItemListMenu ariaLabel={t('actionsFor', { name: item.displayName })}>
        <DropdownMenuItem onSelect={() => openDetails(item.id)}>
          {t('list.viewDetails')}
        </DropdownMenuItem>
        <WebononeCopyToAiMenuItem kind="staff" id={item.id} label={item.displayName} />
        {canManage ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={removingId === item.id}
              onSelect={() => setPendingRemove(item)}
              className="text-destructive focus:text-destructive"
            >
              {removingId === item.id ? tc('loading') : tc('remove')}
            </DropdownMenuItem>
          </>
        ) : null}
      </ItemListMenu>
    )
  }

  function rowBody(item: CompanyStaff) {
    return (
      <>
        <div className="flex items-start gap-3">
          <ImagePreview
            src={item.avatarUrl}
            alt={item.displayName}
            mode="view"
            className={itemListThumbClassName}
          />
          <div className="min-w-0 space-y-1">{staffDetails(item)}</div>
        </div>
      </>
    )
  }

  function staffDetails(item: CompanyStaff) {
    return (
      <>
        <p className="truncate font-medium text-foreground">{item.displayName}</p>
        <ContactValueLine kind="email" value={item.email} emptyLabel={tc('email')} />
        <p className="truncate text-xs text-muted-foreground">
          {formatWorkingDaysSummary(item.schedule)}
        </p>
      </>
    )
  }

  return (
    <>
      <CollectionListView
        items={items}
        getRowKey={(item) => item.id}
        columns={columns}
        empty={<ItemListEmpty>{t('list.empty')}</ItemListEmpty>}
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
                src={item.avatarUrl}
                alt={item.displayName}
                mode="view"
                className={itemListCardImageClassName}
              />
            }
            menu={renderRowMenu(item)}
            onBodyClick={() => openDetails(item.id)}
          >
            <div className="min-w-0 space-y-1">{staffDetails(item)}</div>
          </ItemListCollectionCard>
        )}
      />
      <PlatformAlertConfirmDialog
        open={pendingRemove !== null}
        title={
          pendingRemove
            ? t('list.removeTitleNamed', { name: pendingRemove.displayName })
            : t('list.removeTitle')
        }
        description={t('list.removeDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={tc('remove')}
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
