import type { ReactNode } from 'react'
import { Edit3 } from 'lucide-react'
import { Button } from './Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type CardVariant,
} from './Card'
import { cn } from '../lib/utils'

export interface EditableSectionCardProps {
  title: string
  description?: string
  titleExtra?: ReactNode
  headerTrailing?: ReactNode
  canEdit?: boolean
  onEdit?: () => void
  editAriaLabel?: string
  variant?: CardVariant
  className?: string
  contentClassName?: string
  children: ReactNode
}

export function EditableSectionCard({
  title,
  description,
  titleExtra,
  headerTrailing,
  canEdit = false,
  onEdit,
  editAriaLabel,
  variant,
  className,
  contentClassName,
  children,
}: EditableSectionCardProps) {
  const showEdit = canEdit && Boolean(onEdit)

  return (
    <Card className={cn('group', className)} variant={variant}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            {titleExtra ? (
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{title}</CardTitle>
                {titleExtra}
              </div>
            ) : (
              <CardTitle className="text-lg">{title}</CardTitle>
            )}
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {headerTrailing || showEdit ? (
            <div className="flex shrink-0 items-start gap-2">
              {headerTrailing}
              {showEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={onEdit}
                  aria-label={editAriaLabel ?? `Edit ${title}`}
                >
                  <Edit3 className="h-4 w-4" aria-hidden />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn('space-y-4', contentClassName)}>{children}</CardContent>
    </Card>
  )
}
