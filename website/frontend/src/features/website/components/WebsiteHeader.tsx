import { BrandLogo, Button } from '@webonone/ui-kit'
import { getWebOnOneAppUrl, getWebOnOneLoginUrl } from '@/features/webonone/utils/webononeConfig'

type WebsiteHeaderProps = {
  className?: string
}

export function WebsiteHeader({ className }: WebsiteHeaderProps) {
  return (
    <header
      className={`flex items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-8 ${className ?? ''}`}
    >
      <a href="/" className="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <BrandLogo>WebOnOne</BrandLogo>
      </a>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" asChild>
          <a href={getWebOnOneAppUrl()}>Open app</a>
        </Button>
        <Button type="button" size="sm" asChild>
          <a href={getWebOnOneLoginUrl()}>Login</a>
        </Button>
      </div>
    </header>
  )
}
