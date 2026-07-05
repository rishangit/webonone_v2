import type { MouseEvent } from 'react'
import { isLocalNavPath } from './isLocalNavPath'

export function handleNavItemClick(
  event: MouseEvent<HTMLAnchorElement>,
  to: string,
  options: {
    onClick?: () => void
    onNavItemNavigate?: (to: string) => void
    onNavigate?: () => void
  },
): void {
  const { onClick, onNavItemNavigate, onNavigate } = options

  if (onClick) {
    event.preventDefault()
    onClick()
  } else if (onNavItemNavigate && isLocalNavPath(to)) {
    event.preventDefault()
    onNavItemNavigate(to)
  }

  onNavigate?.()
}
