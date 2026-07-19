import { cn } from '../lib/utils'
import { Spinner } from './Spinner'

export type LoadingOverlayScope = 'content' | 'viewport'

export interface LoadingStateProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
  /** When true, centered overlay for page, route, and session loads. */
  overlay?: boolean
  /** `content` anchors to a positioned parent; `viewport` covers the full screen. */
  overlayScope?: LoadingOverlayScope
  className?: string
}

function LoadingState({
  label = 'Loading…',
  size = 'lg',
  overlay = false,
  overlayScope = 'content',
  className,
}: LoadingStateProps) {
  const body = (
    <>
      <Spinner size={size} />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </>
  )

  if (overlay) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={cn(
          'z-50 flex flex-col items-center justify-center gap-3 bg-background/80',
          overlayScope === 'viewport' ? 'fixed inset-0' : 'absolute inset-0',
          className,
        )}
      >
        {body}
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}
    >
      {body}
    </div>
  )
}

export { LoadingState }
