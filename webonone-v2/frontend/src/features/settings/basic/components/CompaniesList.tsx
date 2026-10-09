import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  StatusTag,
} from '@webonone/ui-kit'
import { WebononeCopyToAiMenuItem } from '@/features/ai/components/WebononeCopyToAiMenuItem'
import { formatLocaleDateTime } from '@/shared/utils/formatLocaleDate'
import type { AdminCompany, CompanyStatus } from '../services/companyApi'

type CompaniesListProps = {
  items: AdminCompany[]
  updatingId: string | null
  onStatusChange: (id: string, status: CompanyStatus) => void
}

export function CompaniesList({ items, updatingId, onStatusChange }: CompaniesListProps) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const rows = Array.isArray(items) ? items : []

  function openProfile(id: string) {
    navigate(`/companies/${id}`)
  }

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: tc('name'),
        sortable: true,
        compare: (a: AdminCompany, b: AdminCompany) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        cell: (item: AdminCompany) => (
          <button
            type="button"
            className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => openProfile(item.id)}
          >
            {item.name}
          </button>
        ),
      },
      {
        id: 'status',
        header: tc('status'),
        cell: (item: AdminCompany) => <StatusTag variant={item.status} />,
      },
      {
        id: 'created',
        header: t('companiesAdmin.columnCreated'),
        sortable: true,
        compare: (a: AdminCompany, b: AdminCompany) =>
          a.createdAt.localeCompare(b.createdAt),
        cell: (item: AdminCompany) =>
          formatLocaleDateTime(item.createdAt, i18n.language),
      },
    ],
    [i18n.language, t, tc],
  )

  function renderRowMenu(item: AdminCompany) {
    return (
      <ItemListMenu ariaLabel={`Actions for ${item.name}`}>
        <DropdownMenuItem onClick={() => openProfile(item.id)}>View details</DropdownMenuItem>
        <WebononeCopyToAiMenuItem kind="company" id={item.id} label={item.name} />
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
    )
  }

  function companyDetails(item: AdminCompany) {
    return (
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{item.name}</p>
          <StatusTag variant={item.status} />
        </div>
        <p className="text-xs text-muted-foreground">
          Registrant: {item.createdByUserId} · {formatLocaleDateTime(item.createdAt, i18n.language)}
        </p>
      </div>
    )
  }

  function rowBody(item: AdminCompany) {
    return (
      <div className="flex items-start gap-3">
        <ImagePreview
          src={item.logoUrl}
          alt={item.name}
          mode="view"
          className={itemListThumbClassName}
        />
        {companyDetails(item)}
      </div>
    )
  }

  return (
    <CollectionListView
      items={rows}
      getRowKey={(item) => item.id}
      columns={columns}
      empty={<ItemListEmpty>No companies registered yet.</ItemListEmpty>}
      renderGridActions={renderRowMenu}
      renderListItem={(item) => (
        <ItemListItem>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => openProfile(item.id)}
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
              src={item.logoUrl}
              alt={item.name}
              mode="view"
              className={itemListCardImageClassName}
            />
          }
          menu={renderRowMenu(item)}
          onBodyClick={() => openProfile(item.id)}
        >
          {companyDetails(item)}
        </ItemListCollectionCard>
      )}
    />
  )
}
