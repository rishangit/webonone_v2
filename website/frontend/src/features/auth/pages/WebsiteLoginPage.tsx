import { Navigate, useSearchParams } from 'react-router-dom'
import { IdentityLoginFrame } from '@/features/auth/components/IdentityLoginFrame'
import { useWebsiteAuth } from '@/features/auth/context/WebsiteAuthContext'
import { WebsiteHeader } from '@/features/website/components/WebsiteHeader'

function parseReturnPath(raw: string | null): string {
  if (!raw?.trim()) {
    return '/'
  }
  const value = raw.trim()
  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/'
  }
  return value
}

/** Website-owned login: Identity iframe stays on :3018. */
export function WebsiteLoginPage() {
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useWebsiteAuth()
  const returnPath = parseReturnPath(searchParams.get('returnPath'))

  if (isAuthenticated) {
    return <Navigate to={returnPath} replace />
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <WebsiteHeader className="sticky top-0 z-20" />
      <main className="flex min-h-0 flex-1 flex-col">
        <IdentityLoginFrame returnPath={returnPath} />
      </main>
    </div>
  )
}
