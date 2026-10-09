import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformServiceFrame } from '@webonone/platform-embed'
import { CORE_NAV_QUERY_PARAM, toCoreNavQueryValue } from '@webonone/platform-nav'
import { getStoredLocale, LOCALE_QUERY, normalizeLocale } from '@webonone/i18n'
import { buildThemePayload, serializeThemeQueryParams } from '@webonone/theme'
import { useAppSelector } from '@/app/store/hooks'
import { toThemeDto } from '@/features/settings/system-theme/services/themeApi'
import { getNavVariantForSessionRole } from '@/features/session/utils/sessionNav'
import { getSmsOrigin } from '@/features/sms/utils/smsConfig'
import { isAllowedSmsShellNavigatePath } from '@/features/sms/utils/smsShellNavigate'

/** Compact iframe hosting the SMS Credits card on the home Dashboard. */
export function SmsCreditsFrame() {
  const { t } = useTranslation('home')
  const navigate = useNavigate()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const themePreferences = useAppSelector((s) => s.systemTheme.preferences)

  const searchParams = useMemo(() => {
    const navVariant = getNavVariantForSessionRole(activeRole)
    const locale = normalizeLocale(getStoredLocale() ?? undefined)
    const params: Record<string, string> = {
      [CORE_NAV_QUERY_PARAM]: toCoreNavQueryValue(navVariant),
      [LOCALE_QUERY]: locale,
    }
    if (themePreferences) {
      Object.assign(
        params,
        serializeThemeQueryParams(
          buildThemePayload(toThemeDto(themePreferences.theme), themePreferences.colorMode),
        ),
      )
    }
    return params
  }, [activeRole, themePreferences])

  const handlePeerNavigate = useCallback(
    (path: string) => {
      if (!isAllowedSmsShellNavigatePath(path)) return
      const [pathname = path, query = ''] = path.split('?')
      navigate({ pathname, search: query ? `?${query}` : undefined })
    },
    [navigate],
  )

  if (!accessToken) {
    return null
  }

  return (
    <div className="h-52 w-full overflow-hidden">
      <PlatformServiceFrame
        peerOrigin={getSmsOrigin()}
        peerPath="/embed/widgets/credits"
        accessToken={accessToken}
        searchParams={searchParams}
        title={t('smsCreditsFrameTitle')}
        className="block h-full min-h-0 w-full border-0 bg-transparent"
        onPeerNavigate={handlePeerNavigate}
      />
    </div>
  )
}
