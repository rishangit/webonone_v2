import { useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  ConfirmDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  ItemListMenuSeparator,
  StatusTag,
} from '@webonone/mobile-ui'
import type { CompanyStaffLeave } from '@/features/staff/types/staffLeave.types'
import { formatCalendarYmd } from '@/shared/utils/formatDisplayDate'

type StaffLeavesListProps = {
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
  const { t } = useTranslation('staff')
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  if (items.length === 0) {
    return <ItemListEmpty>{t('leaves.empty')}</ItemListEmpty>
  }

  function formatDateRange(leave: CompanyStaffLeave): string {
    const from = formatCalendarYmd(leave.startDate)
    const to = formatCalendarYmd(leave.endDate)
    return from === to ? from : `${from} – ${to}`
  }

  return (
    <>
      <ItemList>
        {items.map((leave) => {
          const isPending = leave.status === 'pending'
          const isRequester = currentUserId != null && leave.requestedByUserId === currentUserId
          const canApproveReject = canManage && isPending
          const canCancel = isPending && (canManage || isRequester)
          const busy = actionId === leave.id

          return (
            <ItemListItem key={leave.id}>
              <View className="min-w-0 flex-1 flex-row items-start justify-between gap-2">
                <ItemListContent
                  title={t(`leaves.types.${leave.leaveType}`)}
                  subtitle={
                    leave.reason
                      ? `${formatDateRange(leave)} · ${leave.reason}`
                      : formatDateRange(leave)
                  }
                />
                <StatusTag variant={leave.status} />
              </View>
              {canApproveReject || canCancel ? (
                <ItemListMenu
                  ariaLabel={t('leaves.actionsFor', {
                    type: t(`leaves.types.${leave.leaveType}`),
                  })}
                >
                  {canApproveReject ? (
                    <>
                      <ItemListMenuItem disabled={busy} onPress={() => void onApprove(leave.id)}>
                        {t('leaves.approve')}
                      </ItemListMenuItem>
                      <ItemListMenuItem
                        disabled={busy}
                        onPress={() => setPendingAction({ kind: 'reject', leave })}
                      >
                        {t('leaves.reject')}
                      </ItemListMenuItem>
                    </>
                  ) : null}
                  {canCancel ? (
                    <>
                      {canApproveReject ? <ItemListMenuSeparator /> : null}
                      <ItemListMenuItem
                        disabled={busy}
                        destructive
                        onPress={() => setPendingAction({ kind: 'cancel', leave })}
                      >
                        {t('leaves.cancel')}
                      </ItemListMenuItem>
                    </>
                  ) : null}
                </ItemListMenu>
              ) : null}
            </ItemListItem>
          )
        })}
      </ItemList>

      <ConfirmDialog
        open={pendingAction?.kind === 'reject'}
        title={t('leaves.rejectTitle')}
        description={t('leaves.rejectDescription')}
        confirmLabel={t('leaves.reject')}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null)
        }}
        onConfirm={() => {
          if (pendingAction?.kind === 'reject') void onReject(pendingAction.leave.id)
          setPendingAction(null)
        }}
      />

      <ConfirmDialog
        open={pendingAction?.kind === 'cancel'}
        title={t('leaves.cancelTitle')}
        description={t('leaves.cancelDescription')}
        confirmLabel={t('leaves.cancel')}
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
