import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@webonone/ui-kit'
import { broadcastThemeToIframes } from '@webonone/theme'
import { useIdentityAuthMessage } from '../hooks/useIdentityAuthMessage'
import { getGuestThemePayload } from '../utils/buildIdentityLoginUrl'
import {
  buildIdentityEmbedAuthUrl,
  type IdentityGuestAuthPath,
  isIdentityGuestAuthPath,
} from '../utils/identityConfig'

type IdentityLoginFrameProps = {
  identityPath?: IdentityGuestAuthPath
  returnPath?: string
  websiteReturnUrl?: string | null
}

export function IdentityLoginFrame({
  identityPath = '/login',
  returnPath = '/',
  websiteReturnUrl = null,
}: IdentityLoginFrameProps) {
  const { t } = useTranslation('auth')
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const promptLogin = searchParams.get('prompt') === 'login'
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const resolvedPath = isIdentityGuestAuthPath(location.pathname)
    ? location.pathname
    : identityPath
  const buildSrc = useCallback(
    () => buildIdentityEmbedAuthUrl(resolvedPath, returnPath, location.search),
    [location.search, resolvedPath, returnPath],
  )
  const [src, setSrc] = useState(buildSrc)
  const [loadError, setLoadError] = useState(false)

  useIdentityAuthMessage({ returnPath, websiteReturnUrl })

  useEffect(() => {
    setSrc(buildSrc())
  }, [buildSrc])

  const applyTheme = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) {
      return
    }
    broadcastThemeToIframes(getGuestThemePayload(), [iframe])
  }, [])

  function handleLoad() {
    setLoadError(false)
    applyTheme()
  }

  function handleRetry() {
    setLoadError(false)
    setSrc(buildSrc())
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col">
      {loadError ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-sm text-muted-foreground">{t('loginFrame.loadFailed')}</p>
          <Button type="button" onClick={handleRetry}>
            {t('common:retry')}
          </Button>
        </div>
      ) : null}
      <iframe
        ref={iframeRef}
        key={`${src}:${promptLogin ? 'prompt' : 'default'}`}
        title={t('loginFrame.iframeTitle')}
        src={src}
        allow="identity-credentials-get"
        onLoad={handleLoad}
        onError={() => setLoadError(true)}
        className={`block h-full min-h-0 w-full flex-1 border-0 bg-transparent ${loadError ? 'hidden' : ''}`}
      />
    </div>
  )
}
