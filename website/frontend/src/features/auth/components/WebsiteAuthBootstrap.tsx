import { useEffect } from 'react'
import { useWebsiteAuth } from '@/features/auth/context/WebsiteAuthContext'
import { useWebsiteAuthCodeBootstrap } from '@/features/auth/hooks/useWebsiteAuthCodeBootstrap'
import { useWebsiteSilentSso } from '@/features/auth/hooks/useWebsiteSilentSso'

/**
 * Exchanges auth-code login returns and runs Identity silent SSO (iframe).
 * Reports combined pending state so chrome can avoid Login↔avatar flicker.
 */
export function WebsiteAuthBootstrap() {
  const { setAuthPending } = useWebsiteAuth()
  const { isBootstrapping } = useWebsiteAuthCodeBootstrap()
  const { isChecking, iframeSrc } = useWebsiteSilentSso()

  useEffect(() => {
    setAuthPending(isChecking || isBootstrapping)
  }, [isBootstrapping, isChecking, setAuthPending])

  if (!iframeSrc) {
    return null
  }

  return (
    <iframe
      title="Website silent SSO"
      src={iframeSrc}
      aria-hidden
      tabIndex={-1}
      className="pointer-events-none fixed h-0 w-0 border-0 opacity-0"
    />
  )
}
