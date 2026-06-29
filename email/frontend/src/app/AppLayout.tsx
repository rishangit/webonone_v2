import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell, BrandLogo, Button } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { filterNavByRole } from '@/features/shell/config/navItems'
import { getWebOnOneOrigin } from '@/features/auth/utils/identityConfig'
import type { EmailRole } from '@/features/auth/types/auth.types'

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)

  const role: EmailRole = user?.role ?? 'member'
  const nav = useMemo(() => filterNavByRole(role), [role])

  const returnUrl = searchParams.get('return_url')
  const showBackToWebOnOne = Boolean(returnUrl) || document.referrer.startsWith(getWebOnOneOrigin())

  function handleLogout() {
    dispatch(authActions.logout())
    navigate('/login')
  }

  function handleBackToWebOnOne() {
    const target = returnUrl ?? getWebOnOneOrigin()
    window.location.assign(target)
  }

  return (
    <AppShell
      nav={nav}
      activePath={location.pathname}
      logo={<BrandLogo>Email</BrandLogo>}
      user={
        user
          ? {
              displayName: user.displayName,
              avatarUrl: user.avatarUrl ?? null,
              email: user.email,
            }
          : null
      }
      onLogout={handleLogout}
    >
      {showBackToWebOnOne ? (
        <div className="mb-4">
          <Button type="button" variant="outline" size="sm" onClick={handleBackToWebOnOne}>
            Back to WebOnOne
          </Button>
        </div>
      ) : null}
      <Outlet />
    </AppShell>
  )
}
