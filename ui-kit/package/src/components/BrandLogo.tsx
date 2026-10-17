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
  const defaultWordmark =
    typeof alt === 'string' && alt.length > 0 ? alt : 'WebOnOne'
  const wordmark = children ?? defaultWordmark
  const brandNameForA11y =
    typeof children === 'string'
      ? children
      : typeof alt === 'string' && alt.length > 0
        ? alt
        : 'WebOnOne'
  const wordmarkClassName = cn(
    'text-lg font-semibold tracking-tight text-foreground',
    mark && 'hidden md:inline',
    className,
  )
  const content = mark ? (
    <>
      <WebOnOneLogoMark className={markClassName} decorative />
      <span className={wordmarkClassName}>{wordmark}</span>
    </>
  ) : (
    <span className={wordmarkClassName}>{wordmark}</span>
  )

  const wrapperClassName = 'inline-flex items-center gap-2'
  /** Logo mark only below `md`; name the control for assistive tech on narrow viewports. */
  const brandAriaLabel = mark ? brandNameForA11y : undefined

  if (href) {
    return (
      <a href={href} className={cn(wrapperClassName, 'hover:opacity-90')} aria-label={brandAriaLabel}>
        {content}
      </a>
    )
  }

  return (
    <div className={wrapperClassName} aria-label={brandAriaLabel}>
      {content}
    </div>
  )
}

export { BrandLogo }
