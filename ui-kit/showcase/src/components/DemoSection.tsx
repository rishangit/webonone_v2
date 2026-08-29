import type { ReactNode } from 'react'
import {
  cn,
  shapeCardClassName,
  shapeCardSurfaceClassName,
  shapeCardToneClassName,
  type CardTone,
} from '@webonone/ui-kit'

interface DemoSectionProps {
  id: string
  title: string
  description?: string
  tone?: CardTone
  children: ReactNode
}

export function DemoSection({ id, title, description, tone = 'primary', children }: DemoSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <div>
        <h2 className="ui-title text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className={cn(shapeCardClassName, shapeCardToneClassName(tone))}>
        <div className={`glass-card ${shapeCardSurfaceClassName} p-6`}>{children}</div>
      </div>
    </section>
  )
}
