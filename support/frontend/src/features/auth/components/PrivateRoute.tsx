import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/store/hooks'

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const location = useLocation()

  if (!accessToken) {
    const returnPath = `${location.pathname}${location.search}`
    return <Navigate to={`/login?return=${encodeURIComponent(returnPath)}`} replace />
  }

  return children
}
