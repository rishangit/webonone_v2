import { LoadingState } from '@webonone/ui-kit'
import { useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/app/store/hooks'
import { hasPlatformHandoff } from '@/features/auth/utils/platformReturn'

export function PlatformHandoffSpinner() {
  return <LoadingState overlay label="Loading…" />
}

/** True while auth-code exchange is in progress (return_url + code, no token yet). */
export function usePlatformHandoffPending(): boolean {
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  return hasPlatformHandoff(searchParams) && !accessToken
}
