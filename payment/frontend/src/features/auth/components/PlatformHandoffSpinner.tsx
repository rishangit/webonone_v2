import { LoadingState } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/app/store/hooks'
import { hasAnyPlatformHandoff } from '@/features/auth/utils/platformReturn'

export function PlatformHandoffSpinner() {
  const { t } = useTranslation('common')
  return <LoadingState overlay label={t('loading')} />
}

/**
 * True while a platform handoff has no token yet — redirect (return_url + code)
 * or embed (embed=platform + parentOrigin, token arrives via postMessage).
 * Gates RoleRoute so it waits for the token instead of flashing /login.
 */
export function usePlatformHandoffPending(): boolean {
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  return hasAnyPlatformHandoff(searchParams) && !accessToken
}
