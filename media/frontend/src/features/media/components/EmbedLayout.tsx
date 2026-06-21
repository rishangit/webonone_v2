import type { ReactNode } from 'react'

interface EmbedLayoutProps {
  title: string
  children: ReactNode
  actions?: ReactNode
}

export function EmbedLayout({ title, children, actions }: EmbedLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-sm font-semibold">{title}</h1>
        {actions}
      </header>
      <main className="min-h-0 flex-1 overflow-auto p-4">{children}</main>
    </div>
  )
}
