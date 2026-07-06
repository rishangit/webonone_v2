import type { ReactNode } from 'react'
import { usePlatformEmbedCanvas } from './usePlatformEmbedCanvas'

type PlatformEmbedShellProps = {
  children: ReactNode
  className?: string
}

export function PlatformEmbedShell({ children, className }: PlatformEmbedShellProps) {
  usePlatformEmbedCanvas()

  const shellClassName = [
    'platform-embed-shell flex h-full min-h-0 w-full flex-col overflow-hidden bg-transparent text-foreground',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClassName}>
      <main className="platform-embed-shell-main scrollbar-themed flex min-h-0 flex-1 flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
