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
  onProfileClick?: () => void
  onLogout?: () => void
  className?: string
}

function PageShell({
  children,
  title,
  logo,
  logoHref,
  user,
  onProfileClick,
  onLogout,
  className,
}: PageShellProps) {
  const logoNode = logo ?? (title ? <BrandLogo>{title}</BrandLogo> : undefined)

  return (
    <div className={cn('min-h-screen', className)}>
      <AppHeader
        logo={logoNode}
        logoHref={logoHref}
        user={user}
        onProfileClick={onProfileClick}
        onLogout={onLogout}
      />
      <main className="w-full px-4 py-8">{children}</main>
    </div>
  )
}

export { PageShell }
export type { AppHeaderUser }
