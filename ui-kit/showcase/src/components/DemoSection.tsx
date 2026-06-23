import type { ReactNode } from 'react'

interface DemoSectionProps {
  id: string
  title: string
  description?: string
  children: ReactNode
}

export function DemoSection({ id, title, description, children }: DemoSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="rounded-lg border bg-card p-6">{children}</div>
    </section>
  )
}
