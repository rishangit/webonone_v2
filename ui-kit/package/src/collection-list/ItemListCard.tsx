import * as React from 'react'
import { cn } from '../lib/utils'
import {
  shapeListRowClassName,
  shapeListRowSurfaceClassName,
  shapePanelSmClassName,
} from '../lib/shape'
import { useUiTheme } from '../ui-theme/UiThemeContext'
import { themeNeedsShapeDom } from '../ui-theme/uiTheme'
import { useInsideCard } from '../components/Card'
import {
  itemListRowNestedActiveClassName,
  itemListRowNestedClassName,
  itemListRowSurfaceClassName,
} from '../components/ItemList'

export const itemListCardClassName = cn(
  itemListRowSurfaceClassName,
  'flex min-h-0 flex-col overflow-hidden p-0',
  shapePanelSmClassName,
)

function ItemListCard({ className, children, ...props }: React.LiHTMLAttributes<HTMLLIElement>) {
  const uiTheme = useUiTheme()
  const shapeDom = themeNeedsShapeDom(uiTheme)
  const nestedInCard = useInsideCard()
  const nestedSurface = nestedInCard ? itemListRowNestedClassName : undefined
  const resolvedClassName =
    nestedInCard && className?.includes('border-primary')
      ? cn(className.replace(/\bborder-primary\b/g, '').trim(), itemListRowNestedActiveClassName)
      : className

  if (!shapeDom) {
    return (
      <li className={cn(itemListCardClassName, resolvedClassName, nestedSurface)} {...props}>
        {children}
      </li>
    )
  }

  return (
    <li className={cn(shapeListRowClassName, resolvedClassName)} {...props}>
      <div
        className={cn(
          itemListRowSurfaceClassName,
          'flex min-h-0 flex-col overflow-hidden p-0',
          shapeListRowSurfaceClassName,
          nestedSurface,
        )}
      >
        {children}
      </div>
    </li>
  )
}

export { ItemListCard }
