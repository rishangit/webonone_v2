import { Suspense, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LoadingState } from '@webonone/ui-kit'

function RouteChunkLoading() {
  const { t } = useTranslation('shell')
  return <LoadingState overlay label={t('loading.route')} />
}

export function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteChunkLoading />}>{children}</Suspense>
}
