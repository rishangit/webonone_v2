import { useWebsiteAuthCodeBootstrap } from '@/features/auth/hooks/useWebsiteAuthCodeBootstrap'
import { useWebsiteSilentSso } from '@/features/auth/hooks/useWebsiteSilentSso'

/**
 * Exchanges auth-code login returns and runs silent SSO against WebOnOne.
 * Renders a hidden iframe only while a silent check is in progress.
 */
export function WebsiteAuthBootstrap() {
  useWebsiteAuthCodeBootstrap()
  const { iframeSrc } = useWebsiteSilentSso()

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
