import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  CollectionListView,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemListCardPlaceholderImage,
  ItemListCollectionCard,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  StatusTag,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { CompanyStaffLeave } from '@/features/staff/types/staffLeave.types'
import { formatCalendarYmd } from '@/shared/utils/formatLocaleDate'

type StaffLeavesListProps = {
  staffId: string
  items: CompanyStaffLeave[]
  canManage: boolean
  currentUserId: string | null
  actionId: string | null
  onApprove: (leaveId: string) => Promise<void>
  onReject: (leaveId: string) => Promise<void>
  onCancel: (leaveId: string) => Promise<void>
}

type PendingAction =
  | { kind: 'reject'; leave: CompanyStaffLeave }
  | { kind: 'cancel'; leave: CompanyStaffLeave }

export function StaffLeavesList({
  items,
  canManage,
  currentUserId,
  actionId,
  onApprove,
  onReject,
  onCancel,
}: StaffLeavesListProps) {
  const { t, i18n } = useTranslation('staff')
  const { t: tc } = useTranslation('common')
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const rows = Array.isArray(items) ? items : []

  function formatDateRange(leave: CompanyStaffLeave): string {
    const from = formatCalendarYmd(leave.startDate, i18n.language)
    const to = formatCalendarYmd(leave.endDate, i18n.language)
    return from === to ? from : `${from} – ${to}`
  }

  const columns = useMemo(
    () => [
      {
        id: 'type',
        header: t('leaves.columnType'),
        sortable: true,
        compare: (a: CompanyStaffLeave, b: CompanyStaffLeave) =>
          t(`leaves.types.${a.leaveType}`).localeCompare(t(`leaves.types.${b.leaveType}`), undefined, {
            sensitivity: 'base',
          }),
        cell: (leave: CompanyStaffLeave) => t(`leaves.types.${leave.leaveType}`),
      },
      {
        id: 'dates',
        header: t('leaves.columnDates'),
        sortable: true,
        compare: (a: CompanyStaffLeave, b: CompanyStaffLeave) =>
          a.startDate.localeCompare(b.startDate),
        cell: (leave: CompanyStaffLeave) => formatDateRange(leave),
      },
      {
        id: 'status',
        header: tc('status'),
        cell: (leave: CompanyStaffLeave) => <StatusTag variant={leave.status} />,
      },
    ],
    [i18n.language, t, tc],
  )

  function renderRowMenu(leave: CompanyStaffLeave) {
    const isPending = leave.status === 'pending'
    const isRequester = currentUserId != null && leave.requestedByUserId === currentUserId
    const canApproveReject = canManage && isPending
    const canCancelLeave = isPending && (canManage || isRequester)
    const busy = actionId === leave.id

    if (!canApproveReject && !canCancelLeave) return null

    return (
      <ItemListMenu
        ariaLabel={t('leaves.actionsFor', { type: t(`leaves.types.${leave.leaveType}`) })}
      >
        {canApproveReject ? (
          <>
            <DropdownMenuItem disabled={busy} onSelect={() => void onApprove(leave.id)}>
              {t('leaves.approve')}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={busy}
              onSelect={() => setPendingAction({ kind: 'reject', leave })}
            >
              {t('leaves.reject')}
            </DropdownMenuItem>
          </>
        ) : null}
        {canCancelLeave ? (
          <>
            {canApproveReject ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              disabled={busy}
              className="text-destructive focus:text-destructive"
              onSelect={() => setPendingAction({ kind: 'cancel', leave })}
            >
              {t('leaves.cancel')}
            </DropdownMenuItem>
          </>
        ) : null}
      </ItemListMenu>
    )
  }

  function rowBody(leave: CompanyStaffLeave) {
    return (
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-foreground">
            {t(`leaves.types.${leave.leaveType}`)}
          </p>
          <StatusTag variant={leave.status} />
        </div>
        <p className="truncate text-xs text-muted-foreground">{formatDateRange(leave)}</p>
        {leave.reason ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{leave.reason}</p>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <CollectionListView
        items={rows}
        getRowKey={(leave) => leave.id}
        columns={columns}
        empty={<ItemListEmpty>{t('leaves.empty')}</ItemListEmpty>}
        renderGridActions={renderRowMenu}
        renderListItem={(leave) => (
          <ItemListItem>
            <ItemListContent>{rowBody(leave)}</ItemListContent>
            {renderRowMenu(leave)}
          </ItemListItem>
        )}
        renderCard={(leave) => (
          <ItemListCollectionCard
            image={<ItemListCardPlaceholderImage />}
            menu={renderRowMenu(leave)}
          >
            {rowBody(leave)}
          </ItemListCollectionCard>
        )}
      />

      <PlatformAlertConfirmDialog
        open={pendingAction?.kind === 'reject'}
        title={t('leaves.rejectTitle')}
        description={t('leaves.rejectDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={t('leaves.reject')}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null)
        }}
        onConfirm={() => {
          if (pendingAction?.kind === 'reject') void onReject(pendingAction.leave.id)
          setPendingAction(null)
        }}
      />

      <PlatformAlertConfirmDialog
        open={pendingAction?.kind === 'cancel'}
        title={t('leaves.cancelTitle')}
        description={t('leaves.cancelDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={t('leaves.cancel')}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null)
        }}
        onConfirm={() => {
          if (pendingAction?.kind === 'cancel') void onCancel(pendingAction.leave.id)
          setPendingAction(null)
        }}
      />
    </>
  )
}
