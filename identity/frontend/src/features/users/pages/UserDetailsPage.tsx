import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  StatusTag,
  isStatusTagVariant,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { hasPlatformEmbedHandoff } from '@/features/auth/utils/platformReturn'
import { ProfileView } from '@/features/profile/components/ProfileView'
import { getUser } from '@/features/users/services/usersApi'
import type { IdentityUserDetail } from '@/features/users/types'
import {
  getSessionCompanyId,
  isSessionCompanyAdmin,
  isSessionSuperAdmin,
} from '@/features/users/utils/currentRole'

function formatRoleLabel(role: string): string {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function UserDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const isSuperAdmin = isSessionSuperAdmin(accessToken)
  const isCompanyAdmin = isSessionCompanyAdmin(accessToken)
  const companyId = getSessionCompanyId(accessToken)
  const isEmbedHandoff = hasPlatformEmbedHandoff(searchParams)
  const companyMode = isCompanyAdmin && Boolean(companyId)
  const canView = Boolean(accessToken) && (isSuperAdmin || companyMode)

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
    navigate('/users')
  }

  const backButton = (
    <Button type="button" variant="outline" size="sm" onClick={handleBack}>
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back
    </Button>
  )

  if (loading && !user) {
    return null
  }

  if (error || !user) {
    return (
      <FeaturePage
        title="User"
        description="User account details."
        actions={backButton}
      >
        <Alert variant="destructive">
          <AlertDescription>{error ?? 'Unable to load user'}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage
      title={user.displayName}
      description="User account details."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {backButton}
          {user.role ? (
            isStatusTagVariant(user.role) ? (
              <StatusTag variant={user.role} />
            ) : (
              <StatusTag variant="member">{formatRoleLabel(user.role)}</StatusTag>
            )
          ) : null}
        </div>
      }
    >
      <ProfileView user={user} avatarUrl={user.avatarUrl} canEdit={false} />
    </FeaturePage>
  )
}
