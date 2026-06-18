import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

interface BrandLogoProps {
  href?: string
  className?: string
  children?: ReactNode
}

function BrandLogo({ href, className, children }: BrandLogoProps) {
  const content = (
    <span className={cn('text-lg font-semibold tracking-tight text-foreground', className)}>
      {children ?? 'WebOnOne'}
    </span>
  )

  if (href) {
    return (
      <a href={href} className="inline-flex items-center hover:opacity-90">
        {content}
      </a>
    )
  }

  return <div className="inline-flex items-center">{content}</div>
}

export { BrandLogo }
