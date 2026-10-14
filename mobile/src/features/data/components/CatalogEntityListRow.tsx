import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import {
  ImagePreview,
  ItemListContent,
  ItemListItem,
  itemListThumbSmClassName,
} from '@webonone/mobile-ui'

export function CatalogEntityListRow({
  thumbUrl,
  name,
  subtitle,
  onOpen,
  trailing,
  menu,
  children,
}: {
  thumbUrl: string | null
  name: string
  subtitle?: string
  onOpen: () => void
  trailing?: ReactNode
  menu?: ReactNode
  children?: ReactNode
}) {
  return (
    <ItemListItem>
      <ImagePreview src={thumbUrl} alt={name} className={`mr-3 ${itemListThumbSmClassName}`} />
      <Pressable className="min-w-0 flex-1" onPress={onOpen}>
        <ItemListContent title={name} subtitle={subtitle} />
        {children}
      </Pressable>
      {trailing ? <View className="shrink-0 gap-1">{trailing}</View> : null}
      {menu}
    </ItemListItem>
  )
}
