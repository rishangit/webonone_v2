import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  itemListThumbClassName,
  StatusTag,
} from '@webonone/ui-kit'
import { formatLocaleDateTime } from '@/shared/utils/formatLocaleDate'
import type { DashboardCompany } from '@/features/home/services/adminCompaniesApi'

type PendingCompaniesListProps = {
  items: DashboardCompany[]
}

export function PendingCompaniesList({ items }: PendingCompaniesListProps) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('home')

  if (items.length === 0) {
    return <ItemListEmpty>{t('pendingCompaniesEmpty')}</ItemListEmpty>
  }

  const list = (
    <ItemList>
      {items.map((item) => (
        <ItemListItem key={item.id}>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => navigate(`/companies/${item.id}`)}
            >
              <div className="flex items-start gap-3">
                <ImagePreview
                  src={item.logoUrl}
                  alt={item.name}
                  mode="view"
                  className={itemListThumbClassName}
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{item.name}</p>
                    <StatusTag variant={item.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatLocaleDateTime(item.createdAt, i18n.language)}
                  </p>
                </div>
              </div>
            </button>
          </ItemListContent>
        </ItemListItem>
      ))}
    </ItemList>
  )

  if (items.length <= 3) return list

  return <div className="max-h-[16.5rem] overflow-y-auto scrollbar-themed">{list}</div>
}
