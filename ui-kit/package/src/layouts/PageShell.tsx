import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

interface PageShellProps {
  children: ReactNode
  title?: string
  className?: string
}

function PageShell({ children, title, className }: PageShellProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <span className="text-lg font-semibold">{title ?? 'WebOnOne'}</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}

export { PageShell }
