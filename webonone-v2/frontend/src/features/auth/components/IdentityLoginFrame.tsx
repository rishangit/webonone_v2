import { useCallback, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@webonone/ui-kit'
import { broadcastThemeToIframes } from '@webonone/theme'
import { useIdentityAuthMessage } from '../hooks/useIdentityAuthMessage'
import { getGuestThemePayload } from '../utils/buildIdentityLoginUrl'
import { buildIdentityEmbedLoginUrl } from '../utils/identityConfig'

type IdentityLoginFrameProps = {
  returnPath?: string
}

export function IdentityLoginFrame({ returnPath = '/' }: IdentityLoginFrameProps) {
  const [searchParams] = useSearchParams()
  const promptLogin = searchParams.get('prompt') === 'login'
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [src, setSrc] = useState(() => buildIdentityEmbedLoginUrl(returnPath))
  const [loadError, setLoadError] = useState(false)

  useIdentityAuthMessage({ returnPath })

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
    setSrc(buildIdentityEmbedLoginUrl(returnPath))
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col">
      {loadError ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-sm text-muted-foreground">
            Identity sign-in could not be loaded. Check that Identity is running.
          </p>
          <Button type="button" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      ) : null}
      <iframe
        ref={iframeRef}
        key={`${src}:${promptLogin ? 'prompt' : 'default'}`}
        title="Sign in"
        src={src}
        onLoad={handleLoad}
        onError={() => setLoadError(true)}
        className={`block h-full min-h-0 w-full flex-1 border-0 bg-transparent ${loadError ? 'hidden' : ''}`}
      />
    </div>
  )
}
