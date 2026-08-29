import * as React from 'react'
import { cn } from '../lib/utils'
import {
  type CardTone,
  shapeCardClassName,
  shapeCardSurfaceClassName,
  shapeCardToneClassName,
  shapeCompactCardClassName,
  shapeCompactCardSurfaceClassName,
  titleMarkClassName,
} from '../lib/shape'
import { useUiTheme } from '../ui-theme/UiThemeContext'
import { themeNeedsShapeDom } from '../ui-theme/uiTheme'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Unified color for the card surface and corner tabs.
   * Omit to auto-alternate theme primary / secondary across sibling cards.
   */
  tone?: CardTone
  /**
   * Mini card accents (list-row scale) in high-tech; classic stays a single rounded surface.
   */
  compact?: boolean
}

function Card({ className, tone, style, compact, ...props }: CardProps) {
  const uiTheme = useUiTheme()

  if (!themeNeedsShapeDom(uiTheme)) {
    return (
      <div
        className={cn(
          'glass-card glass-card-elevate text-card-foreground shadow-sm rounded-lg border',
          className,
        )}
        style={style}
        {...props}
      />
    )
  }

  if (compact) {
    return (
      <div
        className={cn(shapeCompactCardClassName, tone ? shapeCardToneClassName(tone) : undefined)}
        style={style}
      >
        <div
          className={cn(
            'glass-card item-list-row text-card-foreground shadow-sm',
            shapeCompactCardSurfaceClassName,
            className,
          )}
          {...props}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(shapeCardClassName, tone ? shapeCardToneClassName(tone) : undefined)}
      style={style}
    >
      <div
        className={cn(
          'glass-card glass-card-elevate text-card-foreground shadow-sm',
          shapeCardSurfaceClassName,
          className,
        )}
        {...props}
      />
    </div>
  )
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-4 sm:p-6', className)} {...props} />
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const uiTheme = useUiTheme()

  return (
    <h3
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        themeNeedsShapeDom(uiTheme) ? titleMarkClassName : undefined,
        className,
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 pt-0 sm:p-6 sm:pt-0', className)} {...props} />
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-4 pt-0 sm:p-6 sm:pt-0', className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
