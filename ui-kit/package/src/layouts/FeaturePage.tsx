import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { PageHeader } from './PageHeader'

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
    <div className={cn('flex w-full flex-col gap-6', className)}>
      {headerNode}
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export { FeaturePage }
export type { FeaturePageProps }
