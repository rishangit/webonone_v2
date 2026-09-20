import { useMemo, useState } from 'react'
import { Slot, usePathname, useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { MobileAppShell } from '@webonone/mobile-ui'
import { translateNavItems } from '@webonone/i18n'
import { useSession } from '@/features/auth/SessionContext'
import { AccountSwitchDialog } from '@/features/settings/components/AccountSwitchDialog'
import { NotificationsProvider } from '@/features/notifications/context/NotificationsContext'
import { AppAssistantPanel } from '@/features/ai/components/AppAssistantPanel'
import { NotificationDropdown } from '@/features/notifications/components/NotificationDropdown'
import { AppShellHeaderActions } from '@/features/shell/components/AppShellHeaderActions'
import { useAppHeaderLabels } from '@/features/shell/hooks/useAppHeaderLabels'
import { buildMobileNavForSessionRole } from './navItems'
import {
  ShellStartPanelOutlet,
  ShellStartPanelProvider,
} from '@/features/shell/context/ShellStartPanelContext'

function roleTag(option: { role: string; accountKind?: 'staff' }): string {
  if (option.role === 'super_admin') return 'super_admin'
  if (option.role === 'company_admin') return 'company_admin'
  if (option.accountKind === 'staff') return 'staff'
  return 'member'
}

export function AppShellLayout() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation('common')
  const { t: tShell } = useTranslation('shell')
  const { t: tSession } = useTranslation('session')
  const { user, roleOptions, locale, setLocale, logout } = useSession()
  const [switchOpen, setSwitchOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const headerLabels = useAppHeaderLabels()

  const nav = useMemo(() => {
    if (!user) return []
    const selected = roleOptions.find(
      (option) => option.role === user.role && (option.companyId ?? null) === (user.companyId ?? null),
    )
    const items = buildMobileNavForSessionRole(user.role, selected?.dataEntities, user.companyId)
    const withKit = __DEV__
      ? [...items, { type: 'item' as const, to: '/dev/kit', label: 'UI Kit' }]
      : items
    return translateNavItems(withKit, t)
  }, [roleOptions, t, user])

  const headerUser = user
    ? {
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: roleTag(user),
      }
    : null

  const session =
    user && roleOptions.length > 1
      ? {
          title: user.companyName ?? (user.role === 'super_admin' ? tSession('roles.superAdmin') : user.email),
          subtitle: user.email,
          role: roleTag(user),
          onPress: () => setSwitchOpen(true),
        }
      : user
        ? {
            title: user.companyName ?? (user.role === 'super_admin' ? tSession('roles.superAdmin') : user.email),
            subtitle: user.email,
            role: roleTag(user),
          }
        : null

  return (
    <NotificationsProvider>
      <ShellStartPanelProvider>
      <MobileAppShell
        nav={nav}
        activePath={pathname}
        onNavigate={(to) => router.push(to as Href)}
        user={headerUser}
        onProfilePress={() => router.push('/profile')}
        onLogout={() => void logout()}
        locale={locale}
        onLocaleChange={(next) => void setLocale(next)}
        session={session}
        title={tShell('brand')}
        headerLabels={headerLabels}
        headerActions={
          user ? (
            <AppShellHeaderActions
              assistantOpen={assistantOpen}
              onAssistantOpenChange={(open) => {
                setAssistantOpen(open)
                if (open) setNotificationsOpen(false)
              }}
              notificationsOpen={notificationsOpen}
              onNotificationsOpenChange={(open) => {
                setNotificationsOpen(open)
                if (open) setAssistantOpen(false)
              }}
            />
          ) : null
        }
        shellOverlay={
          user ? (
            <>
              <ShellStartPanelOutlet />
              <AppAssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
              <NotificationDropdown
                open={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
              />
            </>
          ) : null
        }
      >
        <Slot />
        <AccountSwitchDialog
          open={switchOpen}
          onOpenChange={setSwitchOpen}
          onSwitched={() => router.replace('/' as Href)}
        />
      </MobileAppShell>
      </ShellStartPanelProvider>
    </NotificationsProvider>
  )
}
