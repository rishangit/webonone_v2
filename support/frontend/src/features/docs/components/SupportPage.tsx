import type { ReactNode } from 'react'
import { cn } from '@webonone/ui-kit'
import { shellPagePadding } from '@/features/shell/layout/shellLayout'

interface SupportPageProps {
  children: ReactNode
  className?: string
}

export function SupportPage({ children, className }: SupportPageProps) {
  return (
    <div className={cn('flex min-h-full w-full flex-col gap-3', shellPagePadding, className)}>
      {children}
    </div>
  )
}
