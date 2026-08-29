import * as React from 'react'
import { normalizeHexColor } from '../lib/normalizeHexColor'
import { cn } from '../lib/utils'

export interface TagChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string
  color: string
}

/** Colored catalog tag: hashtag prefix and label in the tag color — no pill border or tint background. */
function TagChip({ name, color, className, style, ...props }: TagChipProps) {
  const resolved = normalizeHexColor(color)

  return (
    <span
      className={cn('ui-tag-chip inline-flex max-w-[10rem] items-center gap-0.5 text-xs', className)}
      style={{ color: resolved, ...style }}
      {...props}
    >
      <span className="shrink-0 font-medium leading-none" aria-hidden>#</span>
      <span className="truncate">{name}</span>
    </span>
  )
}

export { TagChip }
