import { MoreVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DataAiEntityKind } from '@webonone/platform-embed'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@webonone/ui-kit'
import { CopyToAiMenuItem } from '@/features/shell/components/CopyToAiMenuItem'

const PAGE_HEADER_MENU_TRIGGER_CLASSNAME =
  'h-9 w-9 shrink-0 rounded-md border border-[hsl(var(--glass-border))] bg-background text-muted-foreground hover:bg-accent hover:text-foreground'

type CatalogLibraryDetailPageMenuProps = {
  kind: DataAiEntityKind
  entityId: string
  entityLabel: string
  ariaLabel: string
  canEdit?: boolean
  canDelete?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function CatalogLibraryDetailPageMenu({
  kind,
  entityId,
  entityLabel,
  ariaLabel,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: CatalogLibraryDetailPageMenuProps) {
  const { t } = useTranslation('shell')
  const { t: tc } = useTranslation('common')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={PAGE_HEADER_MENU_TRIGGER_CLASSNAME}
          aria-label={ariaLabel}
        >
          <MoreVertical className="h-4 w-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <CopyToAiMenuItem kind={kind} id={entityId} label={entityLabel} />
        {canEdit && onEdit ? (
          <DropdownMenuItem onClick={onEdit}>{t('customize')}</DropdownMenuItem>
        ) : null}
        {canDelete && onDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              {tc('remove')}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
