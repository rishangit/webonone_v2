import { Suspense, type ReactNode } from 'react'
import { useDelayedRouteLoading } from '@/features/auth/context/PlatformLoadingContext'

function RouteChunkLoading() {
  useDelayedRouteLoading('Loading page…')
  return null
}

export function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteChunkLoading />}>{children}</Suspense>
}
