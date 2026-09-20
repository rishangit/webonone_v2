import { WEBSITE_BREAKPOINTS } from '@/features/design/website/types'
import type { MediaRef, WebsiteBreakpoint } from '@/features/design/website/types'

export function resolveMediaForBreakpoint(
  media: Partial<Record<WebsiteBreakpoint, MediaRef>> | undefined,
  breakpoint: WebsiteBreakpoint,
): MediaRef | undefined {
  if (!media) return undefined
  const start = WEBSITE_BREAKPOINTS.indexOf(breakpoint)
  for (let i = start; i >= 0; i -= 1) {
    const ref = media[WEBSITE_BREAKPOINTS[i]]
    if (ref) return ref
  }
  for (let i = start + 1; i < WEBSITE_BREAKPOINTS.length; i += 1) {
    const ref = media[WEBSITE_BREAKPOINTS[i]]
    if (ref) return ref
  }
  return undefined
}
