import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { PageHeader } from './PageHeader'
import { shellPagePadding } from './shellContentPadding'

interface FeaturePageProps {
  children: ReactNode
  header?: ReactNode
  title?: string
  description?: string
  actions?: ReactNode
  className?: string
}

function FeaturePage({
  children,
  header,
  title,
  description,
  actions,
  className,
}: FeaturePageProps) {
  const headerNode =
    header ??
    (title ? (
      <PageHeader title={title} description={description} actions={actions} />
    ) : null)

  return (
    <div className={cn('feature-page flex min-h-0 w-full flex-1 flex-col gap-6', shellPagePadding, className)}>
      {headerNode}
      <div className="feature-page-body flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

export { FeaturePage }
export type { FeaturePageProps }
