import { useMemo } from 'react'

import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { AppShell, BrandLogo, LoadingState } from '@webonone/ui-kit'

import {

  createNavItemNavigate,

  isDataNavSentinel,

  isEmailNavSentinel,

  isProfileNavSentinel,

  performPlatformLogout,

} from '@webonone/platform-nav'

import { prefetchNavTarget } from '@/app/routePrefetch'

import { useAppSelector } from '@/app/store/hooks'

import { clearWebOnOneAuthStorage } from '@/features/auth/store/authSlice'

import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'

import { useIdentityUserRefresh } from '@/features/auth/hooks/useIdentityUserRefresh'

import { buildNavForSessionRole } from '@/features/shell/config/navItems'

import { ThemeProviderBridge } from '@/shared/theme/ThemeProviderBridge'

import { SessionRoleGate } from '@/features/session/components/SessionRoleGate'

import { formatSessionRoleLabel } from '@/features/session/utils/formatSessionRoleLabel'

import {

  PlatformLoadingProvider,

  usePlatformOverlayLabel,

} from '@/features/shell/context/PlatformLoadingContext'



function isPlatformPeerEmbedPath(pathname: string): boolean {

  return isEmailNavSentinel(pathname) || isDataNavSentinel(pathname) || isProfileNavSentinel(pathname)

}



export function AppLayout() {

  return (

    <PlatformLoadingProvider>

      <AppLayoutContent />

    </PlatformLoadingProvider>

  )

}



function AppLayoutContent() {

  const navigate = useNavigate()

  const location = useLocation()

  const { accessToken, user } = useAppSelector((s) => s.auth)

  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)

  const roleLabel = formatSessionRoleLabel(activeRole)



  useIdentityUserRefresh()



  const onNavItemNavigate = useMemo(

    () =>

      createNavItemNavigate((target) =>

        navigate({ pathname: target.pathname, search: target.search || undefined }),

      ),

    [navigate],

  )



  const nav = useMemo(() => {

    if (!activeRole) return []

    return buildNavForSessionRole(activeRole)

  }, [activeRole])



  function handleLogout() {

    clearWebOnOneAuthStorage()

    performPlatformLogout(null, { identityOrigin: getIdentityOrigin() })

  }



  function handleProfileClick() {

    if (!accessToken) {

      navigate('/login')

      return

    }

    navigate('/profile')

  }



  const overlayLabel = usePlatformOverlayLabel()

  const embedMain = isPlatformPeerEmbedPath(location.pathname)



  return (

    <ThemeProviderBridge>

      <SessionRoleGate>

        <AppShell

          embedMain={embedMain}

          nav={nav}

          activePath={location.pathname}

          logo={<BrandLogo>WebOnOne</BrandLogo>}

          user={

            user

              ? {

                  displayName: user.displayName,

                  avatarUrl: user.avatarUrl,

                  email: user.email,

                  roleLabel,

                }

              : null

          }

          onProfileClick={user ? handleProfileClick : undefined}

          onLogout={handleLogout}

          onNavItemNavigate={onNavItemNavigate}

          onNavItemPrefetch={prefetchNavTarget}

        >

          <div className={embedMain ? 'relative flex h-full min-h-0 flex-col' : 'relative flex min-h-full flex-col'}>

            <Outlet />

            {overlayLabel ? (

              <LoadingState key="platform-loading" overlay overlayScope="content" label={overlayLabel} />

            ) : null}

          </div>

        </AppShell>

      </SessionRoleGate>

    </ThemeProviderBridge>

  )

}


