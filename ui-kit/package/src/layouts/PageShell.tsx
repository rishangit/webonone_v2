import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { AppHeader, type AppHeaderLocale, type AppHeaderProps, type AppHeaderUser } from '../components/AppHeader'
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
  locale?: AppHeaderLocale
  onLocaleChange?: (locale: AppHeaderLocale) => void
  headerLabels?: AppHeaderProps['labels']
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
  locale,
  onLocaleChange,
  headerLabels,
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
        locale={locale}
        onLocaleChange={onLocaleChange}
        labels={headerLabels}
      />
      <main className="w-full px-2 py-8 sm:px-4">{children}</main>
    </div>
  )
}

export { PageShell }
export type { AppHeaderUser }
