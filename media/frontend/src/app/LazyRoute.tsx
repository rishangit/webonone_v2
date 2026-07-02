import { Suspense, type ReactNode } from 'react'
import { Spinner } from '@webonone/ui-kit'

export function LazyRoute({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8">
          <Spinner size="lg" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
