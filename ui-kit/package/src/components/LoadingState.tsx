import { cn } from '../lib/utils'
import { Spinner } from './Spinner'

export interface LoadingStateProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function LoadingState({ label = 'Loading…', size = 'lg', className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}
    >
      <Spinner size={size} />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  )
}

export { LoadingState }
