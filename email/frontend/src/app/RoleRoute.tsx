import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@/app/store/hooks'
import type { EmailRole } from '@/features/auth/types/auth.types'

interface RoleRouteProps {
  roles: EmailRole[]
  children: React.ReactNode
}

export function RoleRoute({ roles, children }: RoleRouteProps) {
  const role: EmailRole = useAppSelector((s) => s.auth.user?.role ?? 'member')

  if (!roles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return children
}
