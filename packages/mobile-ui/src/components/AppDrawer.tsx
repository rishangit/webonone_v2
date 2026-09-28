import type { ComponentType, ReactNode } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { cn } from '../lib/cn'
import { controlDisplayTextProps } from '../lib/controlStyles'
import { findActiveNavGroupLabel, isNavPathActive } from '../lib/navTargetPath'
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
        contentContainerClassName="gap-1 p-2"
        showsVerticalScrollIndicator={false}
      >
        {nav.map((item) => {
          if (item.type === 'item') {
            return (
              <NavRow
                key={item.to}
                label={item.label}
                icon={item.icon}
                active={isNavPathActive(activePath, item.to)}
                onPress={() => onNavigate(item.to)}
              />
            )
          }

          const siblingTos = item.children.map((child) => child.to)
          const groupActive = item.children.some((child) =>
            isNavPathActive(activePath, child.to, siblingTos),
          )
          const open = expandedGroup === item.label || groupActive

          return (
            <View key={item.label} className="gap-1">
              <NavRow
                label={item.label}
                icon={item.icon}
                active={groupActive}
                expanded={open}
                trailing={
                  <ChevronDown
                    size={16}
                    color={groupActive ? colors.primary : colors.textLabel}
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
                      active={isNavPathActive(activePath, child.to, siblingTos)}
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
  expanded,
}: {
  label: string
  icon?: NavIconComponent
  onPress: () => void
  active: boolean
  nested?: boolean
  trailing?: ReactNode
  expanded?: boolean
}) {
  const colors = useThemeColors()
  const iconColor = active ? colors.primary : colors.textLabel

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, expanded }}
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-3 rounded-control px-3 py-3',
        nested && 'ml-6',
        active && 'border-l-2 border-primary',
      )}
      style={({ pressed }) => [
        active ? { backgroundColor: colors.selection } : undefined,
        pressed && !active ? { backgroundColor: colors.selection } : undefined,
      ]}
    >
      {Icon ? (
        <View className="h-5 w-5 shrink-0 items-center justify-center">
          <Icon size={20} color={iconColor} strokeWidth={2} />
        </View>
      ) : null}

      <Text
        className={cn(
          'min-w-0 flex-1 text-sm font-medium',
          active ? 'font-semibold text-primary' : 'text-label',
        )}
        numberOfLines={1}
        style={active ? { color: colors.primary } : { color: colors.textLabel }}
        {...controlDisplayTextProps()}
      >
        {label}
      </Text>

      {trailing}
    </Pressable>
  )
}

export { findActiveNavGroupLabel }
