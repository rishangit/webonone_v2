import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ImagePreview,
  ContactValueLine,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  itemListThumbClassName,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch } from '@/app/store/hooks'
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
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<CompanyStaff | null>(null)

  if (items.length === 0) {
    return <ItemListEmpty>{t('list.empty')}</ItemListEmpty>
  }

  function openDetails(id: string) {
    navigate(`/staff/${id}`)
  }

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
                  src={item.avatarUrl}
                  alt={item.displayName}
                  mode="view"
                  className={itemListThumbClassName}
                />
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium text-foreground">{item.displayName}</p>
                  <ContactValueLine
                    kind="email"
                    value={item.email}
                    emptyLabel={t('common:email')}
                  />
                  <p className="truncate text-xs text-muted-foreground">
                    {formatWorkingDaysSummary(item.schedule)}
                  </p>
                </div>
              </button>
            </ItemListContent>
            <ItemListMenu ariaLabel={t('actionsFor', { name: item.displayName })}>
              <DropdownMenuItem onSelect={() => openDetails(item.id)}>
                {t('list.viewDetails')}
              </DropdownMenuItem>
              {canManage ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={removingId === item.id}
                    onSelect={() => setPendingRemove(item)}
                    className="text-destructive focus:text-destructive"
                  >
                    {removingId === item.id ? t('common:loading') : t('common:remove')}
                  </DropdownMenuItem>
                </>
              ) : null}
            </ItemListMenu>
          </ItemListItem>
        ))}
      </ItemList>
      <PlatformAlertConfirmDialog
        open={pendingRemove !== null}
        title={
          pendingRemove
            ? t('list.removeTitleNamed', { name: pendingRemove.displayName })
            : t('list.removeTitle')
        }
        description={t('list.removeDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={t('common:remove')}
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
