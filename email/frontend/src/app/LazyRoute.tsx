import { Suspense, type ReactNode } from 'react'
import { useRouteLoading } from '@/features/auth/context/PlatformLoadingContext'

function RouteChunkLoading() {
  useRouteLoading('Loading page…')
  return null
}

export function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteChunkLoading />}>{children}</Suspense>
}
