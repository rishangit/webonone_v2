import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { PageHeader } from './PageHeader'

type FeaturePageMaxWidth = '2xl' | '4xl' | '5xl' | 'full'

const maxWidthClasses: Record<FeaturePageMaxWidth, string> = {
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-none',
}

interface FeaturePageProps {
  children: ReactNode
  header?: ReactNode
  title?: string
  description?: string
  actions?: ReactNode
  maxWidth?: FeaturePageMaxWidth
  className?: string
}

function FeaturePage({
  children,
  header,
  title,
  description,
  actions,
  maxWidth = '4xl',
  className,
}: FeaturePageProps) {
  const headerNode =
    header ??
    (title ? (
      <PageHeader title={title} description={description} actions={actions} />
    ) : null)

  return (
    <div className={cn('mx-auto flex w-full flex-col gap-6', maxWidthClasses[maxWidth], className)}>
      {headerNode}
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export { FeaturePage }
export type { FeaturePageProps, FeaturePageMaxWidth }
