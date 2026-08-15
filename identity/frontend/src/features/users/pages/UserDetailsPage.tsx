import { useEffect, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  StatusTag,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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
  const { t } = useTranslation('users')
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

  usePlatformLoading(loading && !user ? t('loading.user') : null)

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
          setError(err instanceof Error ? err.message : t('errors.loadUserFailed'))
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

  const tabs: { id: UserDetailTab; label: string }[] = [
    { id: 'overview', label: t('tabs.overview') },
    { id: 'history', label: t('tabs.history') },
  ]

  // Keep FeaturePage mounted while loading (no blank return) — matches Data details.
  return (
    <FeaturePage
      title={user?.displayName ?? t('userFallbackTitle')}
      description={t('userDetailsDescription')}
      onBack={handleBack}
      backLabel={t('common:back')}
      actions={
        user?.role ? (
          isStatusTagVariant(user.role) ? (
            <StatusTag variant={user.role} />
          ) : (
            <StatusTag variant="member">{formatRoleLabel(user.role)}</StatusTag>
          )
        ) : undefined
      }
    >
      {error && !user ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {user ? (
        <Tabs
          value={tab}
          onValueChange={(value) => handleTabChange(value as UserDetailTab)}
          className="flex flex-col gap-6"
        >
          <TabsList aria-label={t('sectionsAria')}>
            {tabs.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={tab} className="mt-0 outline-none">
            {tab === 'overview' ? (
              <ProfileView user={user} avatarUrl={user.avatarUrl} canEdit={false} />
            ) : (
              <UserHistoryPanel user={user} />
            )}
          </TabsContent>
        </Tabs>
      ) : null}
    </FeaturePage>
  )
}
