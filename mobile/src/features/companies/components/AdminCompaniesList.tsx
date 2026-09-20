import { Pressable, View } from 'react-native'
import {
  ImagePreview,
  ItemList,
  itemListThumbClassName,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  ItemListMenuSeparator,
  StatusTag,
} from '@webonone/mobile-ui'
import type { AdminCompany, CompanyStatus } from '@/features/companies/services/companyApi'
import { formatCompanyDate } from '@/features/companies/utils/formatCompanyDate'

type AdminCompaniesListProps = {
  items: AdminCompany[]
  updatingId: string | null
  emptyMessage?: string
  onOpenProfile: (companyId: string) => void
  onStatusChange: (id: string, status: CompanyStatus) => void
}

export function AdminCompaniesList({
  items,
  updatingId,
  emptyMessage = 'No companies registered yet.',
  onOpenProfile,
  onStatusChange,
}: AdminCompaniesListProps) {
  if (items.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  return (
    <ItemList>
      {items.map((item) => {
        const createdLabel = formatCompanyDate(item.createdAt)
        const subtitle = createdLabel
          ? `Registrant: ${item.createdByUserId} · ${createdLabel}`
          : `Registrant: ${item.createdByUserId}`

        return (
          <ItemListItem key={item.id}>
            <Pressable className="min-w-0 flex-1 flex-row items-start gap-3" onPress={() => onOpenProfile(item.id)}>
              <ImagePreview src={item.logoUrl} alt={item.name} className={itemListThumbClassName} />
              <View className="min-w-0 flex-1 gap-1">
                <ItemListContent title={item.name} subtitle={subtitle} />
                <StatusTag variant={item.status} />
              </View>
            </Pressable>
            <ItemListMenu ariaLabel={`Actions — ${item.name}`}>
              <ItemListMenuItem onPress={() => onOpenProfile(item.id)}>View details</ItemListMenuItem>
              <ItemListMenuItem
                disabled={updatingId === item.id || item.status === 'approved'}
                onPress={() => onStatusChange(item.id, 'approved')}
              >
                Approve
              </ItemListMenuItem>
              <ItemListMenuItem
                disabled={updatingId === item.id || item.status === 'pending'}
                onPress={() => onStatusChange(item.id, 'pending')}
              >
                Set pending
              </ItemListMenuItem>
              <ItemListMenuSeparator />
              <ItemListMenuItem
                destructive
                disabled={updatingId === item.id || item.status === 'rejected'}
                onPress={() => onStatusChange(item.id, 'rejected')}
              >
                Reject
              </ItemListMenuItem>
            </ItemListMenu>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}
