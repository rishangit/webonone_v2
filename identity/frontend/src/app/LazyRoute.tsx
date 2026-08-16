import { Suspense, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useDelayedRouteLoading } from '@/features/auth/context/PlatformLoadingContext'

function RouteChunkLoading() {
  const { t } = useTranslation('shell')
  useDelayedRouteLoading(t('loading.route'))
  return null
}

export function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteChunkLoading />}>{children}</Suspense>
}
