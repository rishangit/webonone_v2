import * as React from 'react'
import { cn } from '../lib/utils'

/** Card collection layout — fewer columns than dense grids so hero images stay readable. */
export const itemListCardGridClassName =
  'grid grid-cols-1 gap-3 py-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'

function ItemListCardGrid({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul role="list" className={cn(itemListCardGridClassName, className)} {...props} />
}

export { ItemListCardGrid }
