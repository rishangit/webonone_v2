import { useNavigate } from 'react-router-dom'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  StatusTag,
} from '@webonone/ui-kit'
import type { AdminCompany, CompanyStatus } from '../services/companyApi'

type CompaniesListProps = {
  items: AdminCompany[]
  updatingId: string | null
  onStatusChange: (id: string, status: CompanyStatus) => void
}

export function CompaniesList({ items, updatingId, onStatusChange }: CompaniesListProps) {
  const navigate = useNavigate()
  const rows = Array.isArray(items) ? items : []

  if (rows.length === 0) {
    return <ItemListEmpty>No companies registered yet.</ItemListEmpty>
  }

  function openProfile(id: string) {
    navigate(`/companies/${id}`)
  }

  return (
    <ItemList>
      {rows.map((item) => (
        <ItemListItem key={item.id}>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => openProfile(item.id)}
            >
              <div className="flex items-start gap-3">
                <ImagePreview
                  src={item.logoUrl}
                  alt={item.name}
                  mode="view"
                  className="h-10 w-10 rounded-md"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{item.name}</p>
                    <StatusTag variant={item.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registrant: {item.createdByUserId} · {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </button>
          </ItemListContent>
          <ItemListMenu ariaLabel={`Actions for ${item.name}`}>
            <DropdownMenuItem onClick={() => openProfile(item.id)}>View details</DropdownMenuItem>
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
