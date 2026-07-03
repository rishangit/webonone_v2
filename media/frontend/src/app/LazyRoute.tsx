import { Suspense, type ReactNode } from 'react'
import { LoadingState } from '@webonone/ui-kit'

export function LazyRoute({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingState className="min-h-[40vh] flex-1" label="Loading…" />}>
      {children}
    </Suspense>
  )
}
