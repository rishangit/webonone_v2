import type { ReactNode } from 'react'

type SessionQueueBoardProps = {
  prevTokenLabel: string | null
  currentTokenLabel: string | null
  nextTokenLabel: string | null
  actions?: ReactNode
}

export function SessionQueueBoard({
  prevTokenLabel,
  currentTokenLabel,
  nextTokenLabel,
  actions,
}: SessionQueueBoardProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="space-y-1 rounded-md border border-border/60 bg-muted/30 px-2 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Prev
          </p>
          <p className="text-sm font-medium text-muted-foreground">{prevTokenLabel ?? '—'}</p>
        </div>
        <div className="space-y-1 rounded-md border border-primary/40 bg-primary/5 px-2 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Current
          </p>
          <p className="text-base font-semibold text-foreground">{currentTokenLabel ?? '—'}</p>
        </div>
        <div className="space-y-1 rounded-md border border-border/60 bg-muted/30 px-2 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Next
          </p>
          <p className="text-sm font-medium text-muted-foreground">{nextTokenLabel ?? '—'}</p>
        </div>
      </div>
      {actions}
    </div>
  )
}
