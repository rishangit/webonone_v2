import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

interface ListPageBodyProps {
  children: ReactNode
  className?: string
}

function ListPageBody({ children, className }: ListPageBodyProps) {
  return (
    <div className={cn('list-page-body flex flex-1 flex-col gap-6', className)}>{children}</div>
  )
}

export { ListPageBody }
export type { ListPageBodyProps }
