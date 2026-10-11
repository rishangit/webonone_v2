import * as React from 'react'
import { cn } from '../lib/utils'

export type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  /** 0–100 */
  value: number
  max?: number
  indicatorClassName?: string
}

function Progress({
  value,
  max = 100,
  className,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const safeMax = max > 0 ? max : 100
  const clamped = Math.min(safeMax, Math.max(0, value))
  const percent = (clamped / safeMax) * 100

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={clamped}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <div
        className={cn('h-full rounded-full bg-primary transition-[width] duration-300 ease-out', indicatorClassName)}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export { Progress }
