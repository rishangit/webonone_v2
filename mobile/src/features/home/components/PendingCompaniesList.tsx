import { Pressable, View } from 'react-native'
import {
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  itemListThumbClassName,
  StatusTag,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import type { DashboardCompany } from '@/features/home/services/adminCompaniesApi'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

type PendingCompaniesListProps = {
  items: DashboardCompany[]
  onOpen: (companyId: string) => void
}

export function PendingCompaniesList({ items, onOpen }: PendingCompaniesListProps) {
  const { t } = useTranslation('home')

  if (items.length === 0) {
    return <ItemListEmpty>{t('pendingCompaniesEmpty')}</ItemListEmpty>
  }

  return (
    <ItemList>
      {items.map((item) => (
        <ItemListItem key={item.id}>
          <Pressable
            className="min-w-0 flex-1 flex-row items-start gap-3"
            onPress={() => onOpen(item.id)}
          >
            <ImagePreview src={item.logoUrl} alt={item.name} className={itemListThumbClassName} />
            <View className="min-w-0 flex-1 gap-1">
              <ItemListContent title={item.name} subtitle={formatDisplayDateTime(item.createdAt)} />
              <StatusTag variant={item.status} />
            </View>
          </Pressable>
        </ItemListItem>
      ))}
    </ItemList>
  )
}
