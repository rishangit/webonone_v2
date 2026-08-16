import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from '../components/Button'

export interface AppEndPanelProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  closeLabel?: string
  className?: string
}

function AppEndPanel({
  title,
  onClose,
  children,
  footer,
  closeLabel = 'Close',
  className,
}: AppEndPanelProps) {
  return (
    <aside
      className={cn(
        'glass-card flex min-h-0 flex-col overflow-hidden',
        'fixed inset-0 z-[60] w-full',
        'md:static md:z-auto md:h-full md:max-w-sm md:shrink-0 md:border-l',
        className,
      )}
      aria-label={title}
    >
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <Button type="button" variant="ghost" size="icon" aria-label={closeLabel} onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 scrollbar-themed">
        {children}
      </div>
      {footer ? <footer className="flex shrink-0 flex-col gap-2 border-t p-4">{footer}</footer> : null}
    </aside>
  )
}

export { AppEndPanel }
