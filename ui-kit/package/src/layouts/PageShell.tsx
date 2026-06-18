import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { AppHeader, type AppHeaderUser } from '../components/AppHeader'
import { BrandLogo } from '../components/BrandLogo'

interface PageShellProps {
  children: ReactNode
  /** @deprecated Use logo prop instead */
  title?: string
  logo?: ReactNode
  logoHref?: string
  user?: AppHeaderUser | null
  onLogout?: () => void
  className?: string
}

function PageShell({
  children,
  title,
  logo,
  logoHref,
  user,
  onLogout,
  className,
}: PageShellProps) {
  const logoNode = logo ?? (title ? <BrandLogo>{title}</BrandLogo> : undefined)

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <AppHeader logo={logoNode} logoHref={logoHref} user={user} onLogout={onLogout} />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}

export { PageShell }
export type { AppHeaderUser }
