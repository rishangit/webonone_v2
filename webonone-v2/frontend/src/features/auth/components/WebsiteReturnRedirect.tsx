import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { redirectToWebsiteWithAuthCode } from '@/features/auth/utils/redirectToWebsite'

type WebsiteReturnRedirectProps = {
  accessToken: string
  returnUrl: string
}

/** Already authenticated on WebOnOne — send auth code back to the website. */
export function WebsiteReturnRedirect({ accessToken, returnUrl }: WebsiteReturnRedirectProps) {
  const { t } = useTranslation('auth')
  const startedRef = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true

    redirectToWebsiteWithAuthCode(accessToken, returnUrl).catch((err: Error) => {
      setError(err.message || t('callbackError'))
    })
  }, [accessToken, returnUrl, t])

  if (error) {
    return (
      <div className="flex h-dvh items-center justify-center px-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex h-dvh items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">{t('returningToWebsite')}</p>
    </div>
  )
}
