import * as React from 'react'
import { normalizeHexColor } from '../lib/normalizeHexColor'
import { cn } from '../lib/utils'

export interface TagChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string
  color: string
}

/** Colored catalog tag pill: tinted bg, matching border/text, and solid color dot. */
function TagChip({ name, color, className, style, ...props }: TagChipProps) {
  const resolved = normalizeHexColor(color)
  const tintedBg = `${resolved}26`

  return (
    <span
      className={cn(
        'inline-flex max-w-[10rem] items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs',
        className,
      )}
      style={{
        borderColor: resolved,
        backgroundColor: tintedBg,
        color: resolved,
        ...style,
      }}
      {...props}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: resolved }}
        aria-hidden
      />
      <span className="truncate">{name}</span>
    </span>
  )
}

export { TagChip }
