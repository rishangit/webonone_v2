import { Navigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformHandoffPending } from '@/features/auth/components/PlatformHandoffSpinner'
import type { SmsRole } from '@/features/auth/types/auth.types'

interface RoleRouteProps {
  roles: SmsRole[]
  children: React.ReactNode
}

export function RoleRoute({ roles, children }: RoleRouteProps) {
  const handoffPending = usePlatformHandoffPending()
  const role: SmsRole = useAppSelector((s) => s.auth.user?.role ?? 'member')
  const accessToken = useAppSelector((s) => s.auth.accessToken)

  if (handoffPending) {
    return null
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
