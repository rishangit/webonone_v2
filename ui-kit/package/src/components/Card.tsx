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

export type CardVariant = 'default' | 'list'

const CardVariantContext = React.createContext<CardVariant>('default')

function useCardVariant(): CardVariant {
  return React.useContext(CardVariantContext)
}

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
  /**
   * `list` — transparent outer surface (no border/bg/shadow) for sections whose body is an ItemList.
   * CardContent and CardHeader horizontal padding are removed so titles align with list rows.
   */
  variant?: CardVariant
}

const listCardSurfaceClassName =
  'bg-transparent text-card-foreground border-0 shadow-none rounded-none'

function Card({ className, tone, style, compact, variant = 'default', ...props }: CardProps) {
  const uiTheme = useUiTheme()
  const isList = variant === 'list'

  const surface = (
    <CardVariantContext.Provider value={variant}>
      {isList ? (
        <div className={cn(listCardSurfaceClassName, className)} style={style} {...props} />
      ) : !themeNeedsShapeDom(uiTheme) ? (
        <div
          className={cn(
            'glass-card glass-card-elevate text-card-foreground shadow-sm rounded-lg border border-[var(--color-border-light)]',
            className,
          )}
          style={style}
          {...props}
        />
      ) : compact ? (
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
      ) : (
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
      )}
    </CardVariantContext.Provider>
  )

  return surface
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const variant = useCardVariant()
  const isList = variant === 'list'

  return (
    <div
      className={cn(
        'flex flex-col space-y-1.5 p-4 sm:p-6',
        isList && 'px-0 sm:px-0',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const uiTheme = useUiTheme()

  return (
    <h3
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight text-title',
        themeNeedsShapeDom(uiTheme) ? titleMarkClassName : undefined,
        className,
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-description', className)} {...props} />
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const variant = useCardVariant()
  const isList = variant === 'list'

  return (
    <div
      className={cn(
        'p-4 pt-0 sm:p-6 sm:pt-0',
        isList && 'px-0 sm:px-0',
        className,
      )}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const variant = useCardVariant()
  const isList = variant === 'list'

  return (
    <div
      className={cn(
        'flex items-center p-4 pt-0 sm:p-6 sm:pt-0',
        isList && 'px-0 sm:px-0',
        className,
      )}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
