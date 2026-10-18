import { MoreVertical } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import { CompanyCatalogCopyToAiMenuItem } from '@/features/company-catalog/components/CompanyCatalogCopyToAiMenuItem'
import type { CatalogGalleryKind } from '@/features/company-catalog/types/companyCatalog.types'

const PAGE_HEADER_MENU_TRIGGER_CLASSNAME =
  'h-9 w-9 shrink-0 rounded-md border border-[hsl(var(--glass-border))] bg-background text-muted-foreground hover:bg-accent hover:text-foreground'

type CompanyCatalogDetailPageMenuProps = {
  kind: CatalogGalleryKind
  entityId: string
  entityLabel: string
  ariaLabel: string
  canEdit: boolean
  canRemove: boolean
  canShare: boolean
  busy: boolean
  onEdit: () => void
  onRemove: () => void
  onShare: () => void
}

export function CompanyCatalogDetailPageMenu({
  kind,
  entityId,
  entityLabel,
  ariaLabel,
  canEdit,
  canRemove,
  canShare,
  busy,
  onEdit,
  onRemove,
  onShare,
}: CompanyCatalogDetailPageMenuProps) {
  const { t } = useTranslation('catalog')
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
        {canShare ? (
          <DropdownMenuItem disabled={busy} onClick={onShare}>
            {t('share.action')}
          </DropdownMenuItem>
        ) : null}
        <CompanyCatalogCopyToAiMenuItem kind={kind} id={entityId} label={entityLabel} />
        {canEdit ? (
          <DropdownMenuItem disabled={busy} onClick={onEdit}>
            {tc('edit')}
          </DropdownMenuItem>
        ) : null}
        {canRemove ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={busy}
              onClick={onRemove}
            >
              {tc('remove')}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
