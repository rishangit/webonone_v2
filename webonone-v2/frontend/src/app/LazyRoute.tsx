import { Suspense, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useDelayedRouteLoading } from '@/features/shell/context/PlatformLoadingContext'

function RouteChunkLoading() {
  const { t } = useTranslation('shell')
  useDelayedRouteLoading(t('loading.page'))
  return null
}

export function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteChunkLoading />}>{children}</Suspense>
}
