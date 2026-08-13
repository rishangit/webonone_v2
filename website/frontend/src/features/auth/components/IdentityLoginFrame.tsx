import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@webonone/ui-kit'
import { isAuthCancelMessage, isAuthSuccessMessage } from '@webonone/platform-embed'
import { useWebsiteAuth } from '@/features/auth/context/WebsiteAuthContext'
import {
  buildIdentityEmbedLoginUrl,
  getIdentityOrigin,
} from '@/features/auth/utils/identityConfig'

const LOG = '[website-sso]'

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, '')
}

type IdentityLoginFrameProps = {
  returnPath?: string
}

/** Identity login UI framed on the website — no hop to the WebOnOne app. */
export function IdentityLoginFrame({ returnPath = '/' }: IdentityLoginFrameProps) {
  const navigate = useNavigate()
  const { login } = useWebsiteAuth()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const handledRef = useRef(false)
  const [src, setSrc] = useState(() => buildIdentityEmbedLoginUrl(returnPath))
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const identityOrigin = normalizeOrigin(getIdentityOrigin())
    console.log(LOG, 'Identity login iframe', { src, returnPath })

    function onMessage(event: MessageEvent) {
      if (normalizeOrigin(event.origin) !== identityOrigin) {
        return
      }
      if (isAuthSuccessMessage(event.data)) {
        if (handledRef.current) {
          return
        }
        handledRef.current = true
        console.log(LOG, 'Identity login success', { userId: event.data.user.id })
        login({
          accessToken: event.data.accessToken,
          user: {
            id: event.data.user.id,
            email: event.data.user.email,
            displayName: event.data.user.displayName,
            avatarUrl: event.data.user.avatarUrl ?? null,
          },
        })
        navigate(returnPath || '/', { replace: true })
        return
      }
      if (isAuthCancelMessage(event.data)) {
        console.log(LOG, 'Identity login cancel')
        navigate(returnPath || '/', { replace: true })
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [login, navigate, returnPath, src])

  const handleRetry = useCallback(() => {
    setLoadError(false)
    handledRef.current = false
    setSrc(buildIdentityEmbedLoginUrl(returnPath))
  }, [returnPath])

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col">
      {loadError ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-sm text-muted-foreground">Could not load sign-in.</p>
          <Button type="button" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      ) : null}
      <iframe
        ref={iframeRef}
        title="Sign in"
        src={src}
        onLoad={() => setLoadError(false)}
        onError={() => setLoadError(true)}
        className={`block h-full min-h-0 w-full flex-1 border-0 bg-transparent ${loadError ? 'hidden' : ''}`}
      />
    </div>
  )
}
