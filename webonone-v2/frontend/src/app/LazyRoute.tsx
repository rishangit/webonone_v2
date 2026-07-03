import { Suspense, type ReactNode } from 'react'
import { LoadingState } from '@webonone/ui-kit'

export function LazyRoute({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingState overlay label="Loading…" />}>
      {children}
    </Suspense>
  )
}
