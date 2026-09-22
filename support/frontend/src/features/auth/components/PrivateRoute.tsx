import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/app/store/hooks'
import { hasAnyPlatformHandoff } from '@/features/auth/utils/platformReturn'

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const location = useLocation()
  const [searchParams] = useSearchParams()

  if (!accessToken && !hasAnyPlatformHandoff(searchParams)) {
    const returnPath = `${location.pathname}${location.search}`
    return <Navigate to={`/login?return=${encodeURIComponent(returnPath)}`} replace />
  }

  return children
}
