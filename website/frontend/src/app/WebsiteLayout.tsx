import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import {
  ShellOverlayProvider,
  SHELL_OVERLAY_ROOT_ID,
  SHELL_SLIDE_HOST_ID,
  cn,
  shellSlideHostClassName,
} from '@webonone/ui-kit'
import { CatalogAssistant } from '@/features/ai/components/CatalogAssistant'
import {
  shellChromeBodyClassName,
  shellChromeRootClassName,
} from '@/features/shell/layout/shellLayout'
import { WebsiteHeader } from '@/features/website/components/WebsiteHeader'

export function WebsiteLayout() {
  const [assistantOpen, setAssistantOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('app-shell-active')
    return () => document.documentElement.classList.remove('app-shell-active')
  }, [])

  return (
    <div
      className={cn(
        'app-shell-root flex h-dvh flex-col overflow-hidden bg-background text-foreground',
        shellChromeRootClassName,
      )}
    >
      <ShellOverlayProvider>
        <WebsiteHeader
          className="z-50 shrink-0"
          assistantOpen={assistantOpen}
          onAssistantOpenChange={setAssistantOpen}
        />
        <div id={SHELL_OVERLAY_ROOT_ID} aria-hidden />
        <div
          className={cn(
            'app-shell-body relative flex min-h-0 flex-1',
            shellChromeBodyClassName,
          )}
        >
          <main
            id="main-content"
            className="relative min-h-0 min-w-0 flex-1 overflow-hidden"
          >
            <Outlet />
          </main>
          <div id={SHELL_SLIDE_HOST_ID} className={shellSlideHostClassName} aria-hidden />
          <CatalogAssistant open={assistantOpen} onClose={() => setAssistantOpen(false)} />
        </div>
      </ShellOverlayProvider>
    </div>
  )
}
