import { useCallback, useEffect, useMemo, useState, type ComponentProps, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CircleHelp, MessageCircle } from 'lucide-react'
import { AppShell, BrandLogo, Button, ListPageModeProvider, LoadingState, UiThemeProvider, cn, useToast } from '@webonone/ui-kit'
import { isPlatformAiEntityContextMessage } from '@webonone/platform-embed'
import {
  createNavItemNavigate,
  IDENTITY_NAV_SENTINELS,
  isDataNavSentinel,
  isEmailNavSentinel,
  isIdentityNavSentinel,
  isDesignNavSentinel,
  isPaymentNavSentinel,
  isProfileNavSentinel,
  isSmsNavSentinel,
  redirectWithAuthCode,
} from '@webonone/platform-nav'
import { normalizeLocale, translateNavItems, type AppLocale } from '@webonone/i18n'
import { prefetchNavTarget } from '@/app/routePrefetch'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { useIdentitySessionHandoff } from '@/features/auth/hooks/useIdentitySessionHandoff'
import { isImpersonatingSession, stopImpersonation } from '@/features/auth/utils/impersonation'
import { buildWebOnOneLoginHref } from '@/features/auth/utils/buildWebOnOneLoginHref'
import { performWebOnOneLogout } from '@/features/auth/utils/performWebOnOneLogout'
import { getSupportHomeUrl, getSupportRedirectOptions } from '@/features/support'
import { useIdentityUserRefresh } from '@/features/auth/hooks/useIdentityUserRefresh'
import { patchIdentityLocale } from '@/features/auth/services/identityUserApi'
import { buildNavForSessionRole } from '@/features/shell/config/navItems'
import { changeAppLocale } from '@/features/shell/utils/changeAppLocale'
import { ThemeProviderBridge } from '@/shared/theme/ThemeProviderBridge'
import { SessionRoleGate } from '@/features/session/components/SessionRoleGate'
import { sessionRoleActions } from '@/features/session/store/sessionRoleSlice'
import {
  fallbackAccountLabel,
  findMatchingRole,
} from '@/features/session/utils/accountLabels'
import { PlatformMediaDialogProvider } from '@/features/media/PlatformMediaDialogHost'
import { PlatformPeerDialogProvider } from '@/features/shell/PlatformPeerDialogHost'
import { AppAssistant } from '@/features/ai/components/AppAssistant'
import { AiEntityPasteProvider, useAiEntityPaste } from '@/features/ai/context/AiEntityPasteContext'
import { getDataOrigin } from '@/features/data/utils/dataConfig'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import {
  PlatformLoadingProvider,
  usePlatformOverlayLabel,
} from '@/features/shell/context/PlatformLoadingContext'

function isPlatformPeerEmbedPath(pathname: string, activeRole: string | null): boolean {
  if (
    isEmailNavSentinel(pathname) ||
    pathname.startsWith('/email/') ||
    isSmsNavSentinel(pathname) ||
    pathname.startsWith('/sms/') ||
    isPaymentNavSentinel(pathname) ||
    pathname.startsWith('/payment/') ||
    isDesignNavSentinel(pathname) ||
    pathname.startsWith('/design/') ||
    isIdentityNavSentinel(pathname) ||
    isProfileNavSentinel(pathname)
  ) {
    return true
  }
  // Data library embed is only for super_admin; company_admin uses native catalog pages.
  if (isDataNavSentinel(pathname) || pathname.startsWith('/data/')) {
    return activeRole === 'super_admin'
  }
  return false
}

export function AppLayout() {
  return (
    <PlatformLoadingProvider>
      <PlatformMediaDialogProvider>
        <PlatformPeerDialogProvider>
          <AppLayoutContent />
        </PlatformPeerDialogProvider>
      </PlatformMediaDialogProvider>
    </PlatformLoadingProvider>
  )
}

function AppLayoutContent() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation('common')
  const { t: tShell } = useTranslation('shell')
  const { t: tSession } = useTranslation('session')
  const { toast } = useToast()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { activeRole, activeCompanyId, assumableRoles, selectionComplete } = useAppSelector(
    (s) => s.sessionRole,
  )
  const currentLocale = normalizeLocale(i18n.language)
  const [stoppingImpersonation, setStoppingImpersonation] = useState(false)

  useIdentityUserRefresh()
  useIdentitySessionHandoff()

  const onNavItemNavigate = useMemo(
    () =>
      createNavItemNavigate((target) =>
        navigate({ pathname: target.pathname, search: target.search || undefined }),
      ),
    [navigate],
  )

  const handleLocaleChange = useCallback(
    (locale: AppLocale) => {
      void changeAppLocale(locale, {
        persistToIdentity: accessToken
          ? async (lng) => {
              await patchIdentityLocale(accessToken, lng)
            }
          : undefined,
      })
    },
    [accessToken],
  )

  const headerLabels = useMemo(
    () => ({
      language: t('language'),
      english: t('english'),
      sinhala: t('sinhala'),
      profile: t('profile'),
      logout: t('logout'),
    }),
    [t],
  )

  const nav = useMemo(() => {
    if (!activeRole) return []
    const matched = findMatchingRole(assumableRoles, activeRole, activeCompanyId)
    const items =
      activeRole === 'company_admin' || (activeRole === 'member' && activeCompanyId)
        ? buildNavForSessionRole(activeRole, matched?.dataEntities ?? [], activeCompanyId)
        : buildNavForSessionRole(activeRole, undefined, activeCompanyId)
    return translateNavItems(items, t)
  }, [activeRole, activeCompanyId, assumableRoles, t])

  const sidebarSession = useMemo(() => {
    if (!user || !selectionComplete || !activeRole) {
      return null
    }
    const matched = findMatchingRole(assumableRoles, activeRole, activeCompanyId)
    const title =
      matched?.companyName ?? matched?.label ?? fallbackAccountLabel(activeRole, activeCompanyId)
    const displayRole = matched?.accountKind === 'staff' ? 'staff' : activeRole
    return {
      title,
      role: displayRole,
      imageUrl: matched?.companyLogoUrl ?? null,
    }
  }, [user, selectionComplete, activeRole, activeCompanyId, assumableRoles])

  const headerUser = useMemo(() => {
    if (!user) return null
    const matched = findMatchingRole(assumableRoles, activeRole, activeCompanyId)
    const displayRole =
      matched?.accountKind === 'staff' ? 'staff' : (activeRole ?? undefined)
    return {
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      email: user.email,
      role: displayRole,
    }
  }, [user, activeRole, activeCompanyId, assumableRoles])

  const canChangeAccount = assumableRoles.length > 1 && selectionComplete

  const handleSidebarSessionClick = useCallback(() => {
    if (!canChangeAccount) {
      return
    }
    dispatch(sessionRoleActions.openChangeDialog())
  }, [canChangeAccount, dispatch])

  function handleLogout() {
    performWebOnOneLogout()
  }

  function handleProfileClick() {
    if (!accessToken) {
      const returnPath = `${location.pathname}${location.search}`
      navigate(buildWebOnOneLoginHref(returnPath))
      return
    }
    navigate('/profile')
  }

  async function handleStopImpersonation() {
    if (!accessToken) {
      return
    }
    setStoppingImpersonation(true)
    try {
      const result = await stopImpersonation(accessToken)
      dispatch(
        authActions.loginSuccess({
          accessToken: result.accessToken,
          user: {
            id: result.user.id,
            email: result.user.email,
            displayName: result.user.displayName,
            avatarUrl: result.user.avatarUrl ?? null,
            locale: result.user.locale ?? null,
          },
        }),
      )
      dispatch(
        sessionRoleActions.roleSelected({
          role: 'super_admin',
          companyId: null,
          userId: result.user.id,
        }),
      )
      navigate(IDENTITY_NAV_SENTINELS.users)
      toast({ title: tShell('impersonation.stopSuccess') })
    } catch (err) {
      toast({
        title: tShell('impersonation.stopFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setStoppingImpersonation(false)
    }
  }

  const impersonationActive = Boolean(accessToken && user && isImpersonatingSession(accessToken))
  const headerNotice = impersonationActive
    ? (
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate">
            {tShell('impersonation.notice', { name: user!.displayName })}
          </span>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto shrink-0 px-0 text-xs"
            disabled={stoppingImpersonation}
            onClick={() => {
              void handleStopImpersonation()
            }}
          >
            {tShell('impersonation.stop')}
          </Button>
        </div>
      )
    : null

  const overlayLabel = usePlatformOverlayLabel()
  const embedMain = isPlatformPeerEmbedPath(location.pathname, activeRole)
  const listPageMode = useAppSelector((s) => s.systemTheme.preferences?.listPageMode ?? 'pagination')
  const uiTheme = useAppSelector((s) => s.systemTheme.preferences?.uiTheme ?? 'classic')
  const [assistantOpen, setAssistantOpen] = useState(false)
  const openAssistant = useCallback(() => setAssistantOpen(true), [])

  const handleOpenSupport = useCallback(() => {
    if (!accessToken) {
      window.open(getSupportHomeUrl(), '_blank', 'noopener,noreferrer')
      return
    }
    void redirectWithAuthCode(getSupportRedirectOptions({ accessToken })).catch((err: Error) => {
      toast({
        title: tShell('help'),
        description: err.message,
        variant: 'destructive',
      })
    })
  }, [accessToken, tShell, toast])

  return (
    <AiEntityPasteProvider onOpenAssistant={openAssistant}>
      <AppLayoutShell
        assistantOpen={assistantOpen}
        setAssistantOpen={setAssistantOpen}
        overlayLabel={overlayLabel}
        embedMain={embedMain}
        listPageMode={listPageMode}
        uiTheme={uiTheme}
        nav={nav}
        location={location}
        headerUser={headerUser}
        sidebarSession={sidebarSession}
        handleProfileClick={handleProfileClick}
        handleLogout={handleLogout}
        currentLocale={currentLocale}
        handleLocaleChange={handleLocaleChange}
        headerLabels={headerLabels}
        onNavItemNavigate={onNavItemNavigate}
        headerNotice={headerNotice}
        accessToken={accessToken}
        tShell={tShell}
        canChangeAccount={canChangeAccount}
        onSidebarSessionClick={handleSidebarSessionClick}
        sidebarSessionClickLabel={tSession('chooseAccount.changeFromNav')}
        onOpenSupport={handleOpenSupport}
      />
    </AiEntityPasteProvider>
  )
}

type AppLayoutShellProps = {
  assistantOpen: boolean
  setAssistantOpen: Dispatch<SetStateAction<boolean>>
  overlayLabel: string | null
  embedMain: boolean
  listPageMode: 'pagination' | 'on-scroll'
  uiTheme: 'classic' | 'high-tech'
  nav: ComponentProps<typeof AppShell>['nav']
  location: ReturnType<typeof useLocation>
  headerUser: {
    displayName: string
    avatarUrl?: string | null
    email: string
    role?: string
  } | null
  sidebarSession: {
    title: string
    role: string
    imageUrl: string | null
  } | null
  handleProfileClick: () => void
  handleLogout: () => void
  currentLocale: AppLocale
  handleLocaleChange: (locale: AppLocale) => void
  headerLabels: {
    language: string
    english: string
    sinhala: string
    profile: string
    logout: string
  }
  onNavItemNavigate: ReturnType<typeof createNavItemNavigate>
  headerNotice: ReactNode
  accessToken: string | null
  tShell: (key: string) => string
  canChangeAccount: boolean
  onSidebarSessionClick: () => void
  sidebarSessionClickLabel: string
  onOpenSupport: () => void
}

function AppLayoutShell({
  assistantOpen,
  setAssistantOpen,
  overlayLabel,
  embedMain,
  listPageMode,
  uiTheme,
  nav,
  location,
  headerUser,
  sidebarSession,
  handleProfileClick,
  handleLogout,
  currentLocale,
  handleLocaleChange,
  headerLabels,
  onNavItemNavigate,
  headerNotice,
  accessToken,
  tShell,
  canChangeAccount,
  onSidebarSessionClick,
  sidebarSessionClickLabel,
  onOpenSupport,
}: AppLayoutShellProps) {
  const { requestEntityPaste } = useAiEntityPaste()

  useEffect(() => {
    const dataOrigin = getDataOrigin().replace(/\/$/, '')
    function onMessage(event: MessageEvent) {
      if (event.origin.replace(/\/$/, '') !== dataOrigin) {
        return
      }
      if (!isPlatformAiEntityContextMessage(event.data)) {
        return
      }
      const entities =
        event.data.entities && event.data.entities.length > 0
          ? event.data.entities
          : [event.data.entity]
      const payload = {
        entities,
        ...(event.data.composerText ? { composerText: event.data.composerText } : {}),
      }
      if (event.data.openAssistant === false) {
        requestEntityPaste(payload)
        return
      }
      requestEntityPaste(payload)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [requestEntityPaste])

  return (
    <ThemeProviderBridge>
      <UiThemeProvider theme={uiTheme}>
      <ListPageModeProvider mode={listPageMode}>
      <SessionRoleGate>
        <AppShell
          embedMain={embedMain}
          nav={nav}
          activePath={location.pathname}
          logo={<BrandLogo>{tShell('brand')}</BrandLogo>}
          user={headerUser}
          sidebarSession={sidebarSession}
          onSidebarSessionClick={canChangeAccount ? onSidebarSessionClick : undefined}
          sidebarSessionClickLabel={sidebarSessionClickLabel}
          onProfileClick={headerUser ? handleProfileClick : undefined}
          onLogout={handleLogout}
          locale={currentLocale}
          onLocaleChange={handleLocaleChange}
          headerLabels={headerLabels}
          onNavItemNavigate={onNavItemNavigate}
          onNavItemPrefetch={prefetchNavTarget}
          accordionNavGroups
          headerNotice={headerNotice}
          headerActions={
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                aria-label={tShell('help')}
                onClick={onOpenSupport}
              >
                <CircleHelp className="h-4 w-4" />
              </Button>
              {accessToken ? (
                <>
                  <NotificationBell />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn('h-9 w-9 shrink-0', assistantOpen && 'border-primary text-primary')}
                    aria-label={tShell('assistant.open')}
                    aria-pressed={assistantOpen}
                    onClick={() => setAssistantOpen((open) => !open)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </>
              ) : null}
            </>
          }
          aside={
            accessToken ? (
              <AppAssistant open={assistantOpen} onClose={() => setAssistantOpen(false)} />
            ) : undefined
          }
        >
          <div className={embedMain ? 'relative flex h-full min-h-0 flex-col' : 'relative flex min-h-full flex-col'}>
            <Outlet />
            {overlayLabel ? (
              <LoadingState key="platform-loading" overlay overlayScope="content" label={overlayLabel} />
            ) : null}
          </div>
        </AppShell>
      </SessionRoleGate>
      </ListPageModeProvider>
      </UiThemeProvider>
    </ThemeProviderBridge>
  )
}
