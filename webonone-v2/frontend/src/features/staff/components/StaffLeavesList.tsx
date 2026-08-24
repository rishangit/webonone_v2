import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  StatusTag,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { CompanyStaffLeave } from '@/features/staff/types/staffLeave.types'
import { formatLocaleDate } from '@/shared/utils/formatLocaleDate'

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
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const rows = Array.isArray(items) ? items : []

  if (rows.length === 0) {
    return <ItemListEmpty>{t('leaves.empty')}</ItemListEmpty>
  }

  function formatDateRange(leave: CompanyStaffLeave): string {
    const from = formatLocaleDate(leave.startDate, undefined, i18n.language)
    const to = formatLocaleDate(leave.endDate, undefined, i18n.language)
    return from === to ? from : `${from} – ${to}`
  }

  return (
    <>
      <ItemList>
        {rows.map((leave) => {
          const isPending = leave.status === 'pending'
          const isRequester = currentUserId != null && leave.requestedByUserId === currentUserId
          const canApproveReject = canManage && isPending
          const canCancel = isPending && (canManage || isRequester)
          const busy = actionId === leave.id

          return (
            <ItemListItem key={leave.id}>
              <ItemListContent>
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
              </ItemListContent>
              {canApproveReject || canCancel ? (
                <ItemListMenu ariaLabel={t('leaves.actionsFor', { type: t(`leaves.types.${leave.leaveType}`) })}>
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
                  {canCancel ? (
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
              ) : null}
            </ItemListItem>
          )
        })}
      </ItemList>

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
