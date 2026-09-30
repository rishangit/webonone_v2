import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { WebOnOneLogoMark } from './WebOnOneLogoMark'

interface BrandLogoProps {
  href?: string
  className?: string
  children?: ReactNode
  /** Show bundled WebOnOne logo mark (default). Set `false` for text-only. */
  mark?: boolean
  /** Accessible name when `mark` is set. */
  alt?: string
  markClassName?: string
}

function BrandLogo({ href, className, children, mark = true, alt, markClassName }: BrandLogoProps) {
  const accessibleName = alt ?? 'WebOnOne'
  const content = mark ? (
    <WebOnOneLogoMark className={markClassName} title={accessibleName} />
  ) : (
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
