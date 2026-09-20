import { useState, type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Globe, LogOut, Menu, User, X } from 'lucide-react-native'
import { cn } from '../lib/cn'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'
import { Avatar, getAvatarInitials } from './Avatar'
import {
  HeaderMenu,
  HeaderMenuItem,
  HeaderMenuProfileBlock,
  HeaderMenuSeparator,
} from './HeaderMenu'
import { StatusTag } from './StatusTag'

export type AppHeaderLocale = 'en' | 'si'

export type AppHeaderLabels = {
  language?: string
  english?: string
  sinhala?: string
  profile?: string
  logout?: string
  userMenu?: string
  openNavigation?: string
  closeNavigation?: string
}

const DEFAULT_HEADER_LABELS: Required<AppHeaderLabels> = {
  language: 'Language',
  english: 'English',
  sinhala: 'සිංහල',
  profile: 'Profile',
  logout: 'Log out',
  userMenu: 'User menu',
  openNavigation: 'Open navigation',
  closeNavigation: 'Close navigation',
}

export type AppHeaderUser = {
  displayName: string
  email?: string
  role?: string | null
  avatarUrl?: string | null
}

/** Matches web `Button variant="outline" size="icon" className="h-9 w-9"`. */
const headerOutlineIconButtonClassName =
  'h-9 w-9 shrink-0 items-center justify-center rounded-control border border-secondary bg-transparent'

/** Matches web mobile nav toggle — ghost, no border. */
const headerGhostIconButtonClassName =
  'h-9 w-9 shrink-0 items-center justify-center rounded-md bg-transparent'

function HeaderIconButton({
  label,
  onPress,
  children,
  className,
  variant = 'outline',
}: {
  label: string
  onPress: () => void
  children: ReactNode
  className?: string
  variant?: 'outline' | 'ghost'
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={cn(
        variant === 'outline' ? headerOutlineIconButtonClassName : headerGhostIconButtonClassName,
        className,
      )}
    >
      {children}
    </Pressable>
  )
}

function HeaderLocaleMenu({
  locale,
  onLocaleChange,
  labels,
}: {
  locale: AppHeaderLocale
  onLocaleChange: (locale: AppHeaderLocale) => void
  labels: Required<AppHeaderLabels>
}) {
  const iconColor = useThemedControlIconColor()
  const [open, setOpen] = useState(false)

  function pick(next: AppHeaderLocale) {
    onLocaleChange(next)
    setOpen(false)
  }

  return (
    <>
      <HeaderIconButton label={labels.language} onPress={() => setOpen(true)}>
        <Globe size={16} color={iconColor} strokeWidth={2} />
      </HeaderIconButton>
      <HeaderMenu open={open} onClose={() => setOpen(false)} topOffset={64}>
        <HeaderMenuItem label={labels.english} selected={locale === 'en'} onPress={() => pick('en')} />
        <HeaderMenuItem label={labels.sinhala} selected={locale === 'si'} onPress={() => pick('si')} />
      </HeaderMenu>
    </>
  )
}

function HeaderUserMenu({
  user,
  onProfilePress,
  onLogout,
  labels,
}: {
  user: AppHeaderUser
  onProfilePress?: () => void
  onLogout?: () => void
  labels: Required<AppHeaderLabels>
}) {
  const iconColor = useThemedControlIconColor()
  const [open, setOpen] = useState(false)

  function close() {
    setOpen(false)
  }

  function handleProfile() {
    close()
    onProfilePress?.()
  }

  function handleLogout() {
    close()
    onLogout?.()
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labels.userMenu}
        onPress={() => setOpen(true)}
        className={cn(headerOutlineIconButtonClassName, 'overflow-hidden p-0')}
      >
        <Avatar
          size="sm"
          src={user.avatarUrl}
          alt={user.displayName}
          fallback={getAvatarInitials(user.displayName)}
          className="h-full w-full rounded-md border-0"
        />
      </Pressable>
      <HeaderMenu open={open} onClose={close} topOffset={64}>
        <HeaderMenuProfileBlock
          title={user.displayName}
          subtitle={user.email}
          footer={user.role ? <StatusTag role={user.role} /> : null}
          onPress={onProfilePress ? handleProfile : undefined}
        />
        <HeaderMenuSeparator />
        {onProfilePress ? (
          <HeaderMenuItem
            label={labels.profile}
            icon={<User size={16} color={iconColor} strokeWidth={2} />}
            onPress={handleProfile}
          />
        ) : null}
        {onLogout ? (
          <HeaderMenuItem
            label={labels.logout}
            icon={<LogOut size={16} color={iconColor} strokeWidth={2} />}
            onPress={handleLogout}
          />
        ) : null}
      </HeaderMenu>
    </>
  )
}

export function AppHeader({
  title = 'WebOnOne',
  user,
  locale = 'en',
  onMenuPress,
  onProfilePress,
  onLogout,
  onLocaleChange,
  menuOpen,
  showMenuButton = true,
  headerActions,
  labels,
}: {
  title?: string
  user?: AppHeaderUser | null
  locale?: AppHeaderLocale
  onMenuPress?: () => void
  onProfilePress?: () => void
  onLogout?: () => void
  onLocaleChange?: (locale: AppHeaderLocale) => void
  menuOpen?: boolean
  showMenuButton?: boolean
  headerActions?: ReactNode
  labels?: AppHeaderLabels
}) {
  const iconColor = useThemedControlIconColor()
  const resolvedLabels = { ...DEFAULT_HEADER_LABELS, ...labels }

  return (
    <View className="relative z-50 shrink-0 overflow-hidden rounded-shell border border-shell-border bg-shell">
      <View className="h-14 flex-row items-center gap-2 px-2">
        {showMenuButton && onMenuPress ? (
          <HeaderIconButton
            variant="ghost"
            label={menuOpen ? resolvedLabels.closeNavigation : resolvedLabels.openNavigation}
            onPress={onMenuPress}
          >
            {menuOpen ? (
              <X size={20} color={iconColor} strokeWidth={2} />
            ) : (
              <Menu size={20} color={iconColor} strokeWidth={2} />
            )}
          </HeaderIconButton>
        ) : null}
        <Text className="min-w-0 flex-1 text-lg font-bold text-title" numberOfLines={1}>
          {title}
        </Text>
        <View className="shrink-0 flex-row items-center gap-2">
          {headerActions}
          {onLocaleChange ? (
            <HeaderLocaleMenu
              locale={locale}
              onLocaleChange={onLocaleChange}
              labels={resolvedLabels}
            />
          ) : null}
          {user ? (
            <HeaderUserMenu
              user={user}
              onProfilePress={onProfilePress}
              onLogout={onLogout}
              labels={resolvedLabels}
            />
          ) : null}
        </View>
      </View>
    </View>
  )
}

export { HeaderIconButton }
