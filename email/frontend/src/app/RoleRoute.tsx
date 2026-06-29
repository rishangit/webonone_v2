import { Navigate, useSearchParams } from 'react-router-dom'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { hasPlatformHandoff } from '@/features/auth/utils/platformReturn'
import type { EmailRole } from '@/features/auth/types/auth.types'

interface RoleRouteProps {
  roles: EmailRole[]
  children: React.ReactNode
}

export function RoleRoute({ roles, children }: RoleRouteProps) {
  const [searchParams] = useSearchParams()
  const role: EmailRole = useAppSelector((s) => s.auth.user?.role ?? 'member')
  const accessToken = useAppSelector((s) => s.auth.accessToken)

  if (hasPlatformHandoff(searchParams)) {
    return children
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  if (!roles.includes(role)) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          You do not have permission to view this page. Contact an administrator if you need access.
        </AlertDescription>
      </Alert>
    )
  }

  return children
}
