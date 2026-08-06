import { Edit3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@webonone/ui-kit'

interface EditableSectionCardProps {
  title: string
  description?: string
  canEdit?: boolean
  onEdit?: () => void
  children: React.ReactNode
}

export function EditableSectionCard({
  title,
  description,
  canEdit = false,
  onEdit,
  children,
}: EditableSectionCardProps) {
  const { t } = useTranslation('profile')
  return (
    <Card className="group">
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
              aria-label={t('editSection', { title })}
            >
              <Edit3 className="h-4 w-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}
