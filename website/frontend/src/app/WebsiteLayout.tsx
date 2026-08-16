import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { CatalogAssistant } from '@/features/ai/components/CatalogAssistant'
import { WebsiteHeader } from '@/features/website/components/WebsiteHeader'

export function WebsiteLayout() {
  const [assistantOpen, setAssistantOpen] = useState(false)

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <WebsiteHeader
        className="z-20 shrink-0"
        assistantOpen={assistantOpen}
        onAssistantOpenChange={setAssistantOpen}
      />
      <div className="flex min-h-0 flex-1">
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
        <CatalogAssistant open={assistantOpen} onClose={() => setAssistantOpen(false)} />
      </div>
    </div>
  )
}
