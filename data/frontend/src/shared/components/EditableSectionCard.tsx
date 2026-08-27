import { Edit3 } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@webonone/ui-kit'
import { StatusBadge } from '@/shared/components/StatusBadge'

interface EditableSectionCardProps {
  title: string
  description?: string
  /** Data API status — renders Verified/Unverified in the card header top-right */
  status?: string
  canEdit?: boolean
  onEdit?: () => void
  children: React.ReactNode
}

export function EditableSectionCard({
  title,
  description,
  status,
  canEdit = false,
  onEdit,
  children,
}: EditableSectionCardProps) {
  return (
    <Card className="group">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          <div className="flex shrink-0 items-start gap-2">
            {status ? <StatusBadge status={status} /> : null}
            {canEdit && onEdit ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={onEdit}
                aria-label={`Edit ${title}`}
              >
                <Edit3 className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}
