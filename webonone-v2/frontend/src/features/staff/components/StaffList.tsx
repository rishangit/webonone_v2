import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch } from '@/app/store/hooks'
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
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const [removingId, setRemovingId] = useState<string | null>(null)

  if (items.length === 0) {
    return <ItemListEmpty>No staff yet. Add a staff member to get started.</ItemListEmpty>
  }

  function openDetails(id: string) {
    navigate(`/staff/${id}`)
  }

  async function handleRemove(item: CompanyStaff) {
    setRemovingId(item.id)
    try {
      await staffApi.delete(item.id)
      dispatch(staffActions.deleteSucceeded(item.id))
      toast({ title: 'Staff removed' })
      onRemoved()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove staff'
      toast({ title: 'Failed to remove staff', description: message, variant: 'destructive' })
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <ItemList>
      {items.map((item) => (
        <ItemListItem key={item.id}>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => openDetails(item.id)}
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium text-foreground">{item.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{item.email ?? 'No email'}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatWorkingDaysSummary(item.schedule)}
                </p>
              </div>
            </button>
          </ItemListContent>
          <ItemListMenu ariaLabel={`Actions for ${item.displayName}`}>
            <DropdownMenuItem onSelect={() => openDetails(item.id)}>View details</DropdownMenuItem>
            {canManage ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={removingId === item.id}
                  onSelect={() => void handleRemove(item)}
                  className="text-destructive focus:text-destructive"
                >
                  {removingId === item.id ? 'Removing…' : 'Remove'}
                </DropdownMenuItem>
              </>
            ) : null}
          </ItemListMenu>
        </ItemListItem>
      ))}
    </ItemList>
  )
}
