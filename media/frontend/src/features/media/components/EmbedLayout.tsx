import type { ReactNode } from 'react'
import { useEmbedThemeListener, useListPageModeValue } from '@webonone/theme'
import { cn, ListPageModeProvider } from '@webonone/ui-kit'

interface EmbedLayoutProps {
  title: string
  children: ReactNode
  actions?: ReactNode
  parentOrigin?: string | null
  /** Minimal chrome for iframe inside a parent dialog — no header or page background. */
  chromeless?: boolean
  /** Responsive inset padding for chromeless embeds inside a parent dialog. */
  inset?: boolean
}

export function EmbedLayout({
  title,
  children,
  actions,
  parentOrigin,
  chromeless = false,
  inset = false,
}: EmbedLayoutProps) {
  useEmbedThemeListener(parentOrigin)
  const listPageMode = useListPageModeValue(parentOrigin)

  if (chromeless) {
    return (
      <ListPageModeProvider mode={listPageMode}>
        <div className={cn('flex h-dvh min-h-0 w-full flex-col overflow-hidden text-foreground')}>
          <main
            className={cn(
              'flex min-h-0 flex-1 flex-col overflow-hidden',
              inset && 'px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5',
            )}
          >
            {children}
          </main>
        </div>
      </ListPageModeProvider>
    )
  }

  return (
    <ListPageModeProvider mode={listPageMode}>
      <div className="flex h-screen flex-col bg-background text-foreground">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h1 className="text-sm font-semibold">{title}</h1>
          {actions}
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-4 scrollbar-themed">{children}</main>
      </div>
    </ListPageModeProvider>
  )
}
