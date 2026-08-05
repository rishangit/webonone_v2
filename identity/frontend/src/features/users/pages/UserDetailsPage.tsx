import { useEffect, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  StatusTag,
  cn,
  isStatusTagVariant,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { hasPlatformEmbedHandoff } from '@/features/auth/utils/platformReturn'
import { ProfileView } from '@/features/profile/components/ProfileView'
import { UserHistoryPanel } from '@/features/users/components/UserHistoryPanel'
import { getUser } from '@/features/users/services/usersApi'
import type { IdentityUserDetail } from '@/features/users/types'
import {
  getSessionCompanyId,
  isSessionCompanyAdmin,
  isSessionSuperAdmin,
} from '@/features/users/utils/currentRole'
import { useNavigateIdentity } from '@/features/shell/utils/navigateIdentity'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'

const USER_DETAIL_TABS = ['overview', 'history'] as const
type UserDetailTab = (typeof USER_DETAIL_TABS)[number]

function formatRoleLabel(role: string): string {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function UserDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { goToUsersList, syncShellUserTab } = useNavigateIdentity()
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const isSuperAdmin = isSessionSuperAdmin(accessToken)
  const isCompanyAdmin = isSessionCompanyAdmin(accessToken)
  const companyId = getSessionCompanyId(accessToken)
  const isEmbedHandoff = hasPlatformEmbedHandoff(searchParams)
  const companyMode = isCompanyAdmin && Boolean(companyId)
  const canView = Boolean(accessToken) && (isSuperAdmin || companyMode)

  const [tab, setTab] = useDetailTabParam<UserDetailTab>(USER_DETAIL_TABS, 'overview')

  const [user, setUser] = useState<IdentityUserDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  usePlatformLoading(loading && !user ? 'Loading user…' : null)

  useEffect(() => {
    if (!canView || !id) {
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getUser(id)
      .then((detail) => {
        if (!cancelled) {
          setUser(detail)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setUser(null)
          setError(err instanceof Error ? err.message : 'Unable to load user')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [canView, id])

  if (!accessToken) {
    if (isEmbedHandoff) {
      return null
    }
    return <Navigate to="/login" replace />
  }

  if (!isSuperAdmin && !companyMode) {
    return <Navigate to="/profile" replace />
  }

  if (!id) {
    return <Navigate to="/users" replace />
  }

  function handleBack() {
    goToUsersList()
  }

  function handleTabChange(next: UserDetailTab) {
    setTab(next)
    if (id) {
      syncShellUserTab(id, next)
    }
  }

  const backButton = (
    <Button type="button" variant="outline" size="sm" onClick={handleBack}>
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back
    </Button>
  )

  const tabs: { id: UserDetailTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'History' },
  ]

  // Keep FeaturePage mounted while loading (no blank return) — matches Data details.
  return (
    <FeaturePage
      title={user?.displayName ?? 'User'}
      description="User account details."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {backButton}
          {user?.role ? (
            isStatusTagVariant(user.role) ? (
              <StatusTag variant={user.role} />
            ) : (
              <StatusTag variant="member">{formatRoleLabel(user.role)}</StatusTag>
            )
          ) : null}
        </div>
      }
    >
      {error && !user ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {user ? (
        <div className="flex flex-col gap-6">
          <div
            role="tablist"
            aria-label="User sections"
            className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
          >
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`user-tab-${item.id}`}
                aria-selected={tab === item.id}
                aria-controls={`user-panel-${item.id}`}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors',
                  tab === item.id && 'bg-background text-foreground shadow-sm',
                )}
                onClick={() => handleTabChange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            id={`user-panel-${tab}`}
            aria-labelledby={`user-tab-${tab}`}
          >
            {tab === 'overview' ? (
              <ProfileView user={user} avatarUrl={user.avatarUrl} canEdit={false} />
            ) : (
              <UserHistoryPanel user={user} />
            )}
          </div>
        </div>
      ) : null}
    </FeaturePage>
  )
}
