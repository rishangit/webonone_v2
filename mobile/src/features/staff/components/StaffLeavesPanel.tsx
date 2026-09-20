import { useCallback, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Body,
  ListAddButton,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageBody,
  Spinner,
  useToast,
} from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import { StaffLeaveFormDialog } from '@/features/staff/components/StaffLeaveFormDialog'
import { StaffLeaveStatusFilterFields } from '@/features/staff/components/StaffLeaveStatusFilterFields'
import { StaffLeavesList } from '@/features/staff/components/StaffLeavesList'
import { staffLeaveApi } from '@/features/staff/services/staffLeaveApi'
import type { CompanyStaff } from '@/features/staff/types/staff.types'
import type { CompanyStaffLeave } from '@/features/staff/types/staffLeave.types'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'

type StaffLeavesPanelProps = {
  staff: CompanyStaff
  canManage: boolean
}

export function StaffLeavesPanel({ staff, canManage }: StaffLeavesPanelProps) {
  const { t } = useTranslation('staff')
  const { toast } = useToast()
  const { user } = useSession()
  const [addOpen, setAddOpen] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [statusDraft, setStatusDraft] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)

  const fetchPage = useCallback(
    async (query: Record<string, string | number | undefined>) =>
      staffLeaveApi.list(staff.id, {
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 12),
        status: String(query.status ?? 'all'),
      }),
    [staff.id],
  )

  const list = useServerPaginatedList<CompanyStaffLeave>({ fetchPage })

  const status = String(list.queryParams.status ?? 'all')
  const hasActiveFilters = status !== 'all'
  const canAdd = canManage || (user != null && user.id === staff.userId)

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap items-center justify-end gap-2">
        <ListFilterTrigger
          active={hasActiveFilters || filterOpen}
          onPress={() => {
            setStatusDraft(status)
            setFilterOpen(true)
          }}
          accessibilityLabel={t('leaves.filterStatus')}
        />
        {canAdd ? (
          <ListAddButton onPress={() => setAddOpen(true)}>{t('leaves.addLeave')}</ListAddButton>
        ) : null}
      </View>

      <ListFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        title={t('leaves.filtersTitle')}
        onApply={() => list.patchQueryParams({ status: statusDraft })}
        onClear={() => {
          setStatusDraft('all')
          list.patchQueryParams({ status: 'all' })
        }}
      >
        <StaffLeaveStatusFilterFields value={statusDraft} onChange={setStatusDraft} />
      </ListFilterPanel>

      {list.loading ? <Spinner label={t('leaves.loading')} /> : null}
      {!list.loading && list.error ? <Body className="text-destructive">{list.error}</Body> : null}

      {!list.loading ? (
        <ListPageBody>
          <StaffLeavesList
            items={list.items}
            canManage={canManage}
            currentUserId={user?.id ?? null}
            actionId={actionId}
            onApprove={async (leaveId) => {
              setActionId(leaveId)
              try {
                await staffLeaveApi.approve(staff.id, leaveId)
                toast({ title: t('leaves.toastApproved') })
                list.reload()
              } catch (err) {
                toast({
                  title: t('leaves.toastApproveFailed'),
                  description: err instanceof Error ? err.message : undefined,
                  variant: 'destructive',
                })
              } finally {
                setActionId(null)
              }
            }}
            onReject={async (leaveId) => {
              setActionId(leaveId)
              try {
                await staffLeaveApi.reject(staff.id, leaveId)
                toast({ title: t('leaves.toastRejected') })
                list.reload()
              } catch (err) {
                toast({
                  title: t('leaves.toastRejectFailed'),
                  description: err instanceof Error ? err.message : undefined,
                  variant: 'destructive',
                })
              } finally {
                setActionId(null)
              }
            }}
            onCancel={async (leaveId) => {
              setActionId(leaveId)
              try {
                await staffLeaveApi.delete(staff.id, leaveId)
                toast({ title: t('leaves.toastCancelled') })
                list.reload()
              } catch (err) {
                toast({
                  title: t('leaves.toastCancelFailed'),
                  description: err instanceof Error ? err.message : undefined,
                  variant: 'destructive',
                })
              } finally {
                setActionId(null)
              }
            }}
          />
          <TranslatedListPageFooter
            loadedCount={list.items.length}
            totalCount={list.total}
            hasMore={list.hasMore}
            loadingMore={list.loadingMore}
          />
        </ListPageBody>
      ) : null}

      {canAdd ? (
        <StaffLeaveFormDialog
          open={addOpen}
          staffId={staff.id}
          onOpenChange={setAddOpen}
          onSubmit={async (body) => {
            await staffLeaveApi.create(staff.id, body)
            list.reload()
          }}
        />
      ) : null}
    </View>
  )
}
