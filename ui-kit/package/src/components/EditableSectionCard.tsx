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
  canEdit?: boolean
  onEdit?: () => void
  variant?: CardVariant
  className?: string
  contentClassName?: string
  children: React.ReactNode
}

export function EditableSectionCard({
  title,
  description,
  canEdit = false,
  onEdit,
  variant,
  className,
  contentClassName,
  children,
}: EditableSectionCardProps) {
  return (
    <Card className={cn('group', className)} variant={variant}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {canEdit && onEdit ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              onClick={onEdit}
              aria-label={`Edit ${title}`}
            >
              <Edit3 className="h-4 w-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn('space-y-4', contentClassName)}>{children}</CardContent>
    </Card>
  )
}
