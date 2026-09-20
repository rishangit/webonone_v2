import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import {
  Box,
  ChevronDown,
  ChevronRight,
  GalleryHorizontal,
  Image as ImageIcon,
  LayoutTemplate,
  ListTree,
  MousePointerClick,
  Type,
  type LucideIcon,
} from 'lucide-react-native'
import { Body, ItemListMenu, useThemedControlIconColor } from '@webonone/mobile-ui'
import type { WebsiteAddon } from '@/features/design/website/types'

export const TREE_NEST_PX = 8

export const ADDON_ICONS: Record<WebsiteAddon['type'], LucideIcon> = {
  image: ImageIcon,
  slider: GalleryHorizontal,
  text: Type,
  button: MousePointerClick,
  menu: ListTree,
}

export { Box, ChevronDown, ChevronRight, LayoutTemplate }

export function TreeNavRow({
  icon: Icon,
  label,
  active,
  menu,
  onSelect,
}: {
  icon: LucideIcon
  label: string
  active?: boolean
  menu?: ReactNode
  onSelect: () => void
}) {
  const iconColor = useThemedControlIconColor({ active })

  return (
    <View
      className={`min-w-0 flex-1 flex-row items-center gap-2 rounded-md px-2 py-1.5 ${
        active ? 'border-l-2 border-primary bg-accent/60' : ''
      }`}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onSelect}
        className="min-w-0 flex-1 flex-row items-center gap-2"
      >
        <Icon size={20} color={iconColor} strokeWidth={2} />
        <Body className="min-w-0 flex-1 text-sm font-medium" numberOfLines={1}>
          {label}
        </Body>
      </Pressable>
      {menu}
    </View>
  )
}

export function TreeRowMenu({
  ariaLabel,
  children,
}: {
  ariaLabel: string
  children: ReactNode
}) {
  return <ItemListMenu ariaLabel={ariaLabel}>{children}</ItemListMenu>
}
