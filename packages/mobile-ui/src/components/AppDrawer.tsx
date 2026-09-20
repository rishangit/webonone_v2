import type { ComponentType, ReactNode } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { ChevronDown } from 'lucide-react-native'

import { cn } from '../lib/cn'
import { hexToRgba } from '../theme/themeVars'
import { useThemeColors } from '../theme/ThemeProvider'
import { Avatar, getAvatarInitials } from './Avatar'
import { Card } from './Card'
import { StatusTag } from './StatusTag'
import { Body, Muted } from './Typography'



export type NavIconComponent = ComponentType<{

  size?: number

  color?: string

  strokeWidth?: number

}>



export type MobileNavLeaf = {

  type: 'item'

  to: string

  label: string

  icon?: NavIconComponent

}



export type MobileNavGroup = {

  type: 'group'

  label: string

  icon?: NavIconComponent

  children: MobileNavLeaf[]

}



export type MobileNavItem = MobileNavLeaf | MobileNavGroup



export type DrawerSession = {

  title: string

  subtitle?: string | null

  role?: string | null

  onPress?: () => void

}






function SessionLogo({ title }: { title: string }) {
  return (
    <Avatar
      size="sm"
      alt={title}
      fallback={getAvatarInitials(title)}
      className="shrink-0"
    />
  )
}



export function AppDrawer({

  nav,

  activePath,

  expandedGroup,

  onToggleGroup,

  onNavigate,

  session,

}: {

  nav: MobileNavItem[]

  activePath: string

  expandedGroup: string | null

  onToggleGroup: (label: string) => void

  onNavigate: (to: string) => void

  session?: DrawerSession | null

}) {

  const colors = useThemeColors()

  return (

    <View className="flex-1 bg-shell">

      <ScrollView

        className="flex-1"

        contentContainerClassName="gap-0.5 p-1.5"

        showsVerticalScrollIndicator={false}

      >

        {nav.map((item) => {

          if (item.type === 'item') {

            return (

              <NavRow

                key={item.to}

                label={item.label}

                icon={item.icon}

                active={isActivePath(activePath, item.to)}

                onPress={() => onNavigate(item.to)}

              />

            )

          }



          const open =

            expandedGroup === item.label ||

            item.children.some((child) => isActivePath(activePath, child.to))

          const groupActive = item.children.some((child) => isActivePath(activePath, child.to))



          return (

            <View key={item.label} className="gap-0.5">

              <NavRow

                label={item.label}

                icon={item.icon}

                active={groupActive}

                trailing={

                  <ChevronDown

                    size={16}

                    color={groupActive ? colors.primary : colors.textMuted}

                    style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}

                  />

                }

                onPress={() => onToggleGroup(item.label)}

              />

              {open

                ? item.children.map((child) => (

                    <NavRow

                      key={child.to}

                      label={child.label}

                      icon={child.icon}

                      nested

                      active={isActivePath(activePath, child.to)}

                      onPress={() => onNavigate(child.to)}

                    />

                  ))

                : null}

            </View>

          )

        })}

      </ScrollView>

      {session ? (

        <View className="p-2 pb-3">

          <Pressable

            accessibilityRole={session.onPress ? 'button' : undefined}

            onPress={session.onPress}

            disabled={!session.onPress}

          >

            <Card compact className="flex-row items-center gap-2.5 border-shell-border px-3 py-2 shadow-none">

              <SessionLogo title={session.title} />

              <View className="min-w-0 flex-1">

                <Body className="text-sm font-medium" numberOfLines={1}>

                  {session.title}

                </Body>

                {session.subtitle ? (

                  <Muted className="text-xs" numberOfLines={1}>{session.subtitle}</Muted>

                ) : null}

                {session.role ? (

                  <View className="mt-0.5">

                    <StatusTag role={session.role} />

                  </View>

                ) : null}

              </View>

            </Card>

          </Pressable>

        </View>

      ) : null}

    </View>

  )

}



function NavRow({

  label,

  icon: Icon,

  onPress,

  active,

  nested,

  trailing,

}: {

  label: string

  icon?: NavIconComponent

  onPress: () => void

  active: boolean

  nested?: boolean

  trailing?: ReactNode

}) {

  const colors = useThemeColors()
  const iconColor = active ? colors.primary : colors.textMuted

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-2 rounded-full px-2.5 py-2',
        nested && 'ml-5',
        active && 'border-l-2 border-primary',
      )}
      style={active ? { backgroundColor: hexToRgba(colors.primary, 0.1) } : undefined}
    >
      {Icon ? (
        <View className="h-7 w-7 shrink-0 items-center justify-center">
          <Icon size={17} color={iconColor} strokeWidth={2} />
        </View>
      ) : null}

      <Text

        className={cn('flex-1 text-sm font-medium', active ? 'font-semibold text-primary' : 'text-foreground')}

        numberOfLines={1}

      >

        {label}

      </Text>

      {trailing}

    </Pressable>

  )

}



function isActivePath(activePath: string, to: string): boolean {

  if (to === '/') return activePath === '/'

  return activePath === to || activePath.startsWith(`${to}/`)

}


