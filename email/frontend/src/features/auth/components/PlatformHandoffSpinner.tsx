import { useSearchParams } from 'react-router-dom'
import { Spinner } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { hasPlatformHandoff } from '@/features/auth/utils/platformReturn'

export function PlatformHandoffSpinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  )
}

/** True while auth-code exchange is in progress (return_url + code, no token yet). */
export function usePlatformHandoffPending(): boolean {
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  return hasPlatformHandoff(searchParams) && !accessToken
}
