import * as React from 'react'
import { cn } from '../lib/utils'

/** Card collection layout — 1 column on phones, 2 on tablets, 4 from laptop (`lg`) up. */
export const itemListCardGridClassName =
  'grid grid-cols-1 items-stretch gap-3 py-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4'

function ItemListCardGrid({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul role="list" className={cn(itemListCardGridClassName, className)} {...props} />
}

export { ItemListCardGrid }
