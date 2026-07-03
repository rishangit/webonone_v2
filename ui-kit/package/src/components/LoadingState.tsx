import { cn } from '../lib/utils'
import { Spinner } from './Spinner'

export interface LoadingStateProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
  /** When true, viewport-centered overlay for page, route, and session loads. */
  overlay?: boolean
  className?: string
}

function LoadingState({ label = 'Loading…', size = 'lg', overlay = false, className }: LoadingStateProps) {
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
          'fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm',
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
