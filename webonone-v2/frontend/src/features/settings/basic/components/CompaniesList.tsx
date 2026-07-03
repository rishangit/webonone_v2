import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import type { AdminCompany, CompanyStatus } from '../services/companyApi'

type CompaniesListProps = {
  items: AdminCompany[]
  updatingId: string | null
  onStatusChange: (id: string, status: CompanyStatus) => void
}

function statusLabel(status: CompanyStatus): string {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  return 'Pending'
}

function statusClassName(status: CompanyStatus): string {
  if (status === 'approved') return 'bg-primary/15 text-primary'
  if (status === 'rejected') return 'bg-destructive/15 text-destructive'
  return 'bg-muted text-muted-foreground'
}

export function CompaniesList({ items, updatingId, onStatusChange }: CompaniesListProps) {
  const rows = Array.isArray(items) ? items : []

  if (rows.length === 0) {
    return <ItemListEmpty>No companies registered yet.</ItemListEmpty>
  }

  return (
    <ItemList>
      {rows.map((item) => (
        <ItemListItem key={item.id}>
          <ItemListContent>
            <div className="flex items-start gap-3">
              {item.logoUrl ? (
                <img src={item.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs">
                  No logo
                </div>
              )}
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{item.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClassName(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Registrant: {item.createdByUserId} · {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </ItemListContent>
          <ItemListMenu ariaLabel={`Actions for ${item.name}`}>
            <DropdownMenuItem
              disabled={updatingId === item.id || item.status === 'approved'}
              onClick={() => onStatusChange(item.id, 'approved')}
            >
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={updatingId === item.id || item.status === 'pending'}
              onClick={() => onStatusChange(item.id, 'pending')}
            >
              Set pending
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={updatingId === item.id || item.status === 'rejected'}
              onClick={() => onStatusChange(item.id, 'rejected')}
            >
              Reject
            </DropdownMenuItem>
          </ItemListMenu>
        </ItemListItem>
      ))}
    </ItemList>
  )
}
