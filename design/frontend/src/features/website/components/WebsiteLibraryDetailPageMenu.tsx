import { MoreVertical } from 'lucide-react'
import type { DesignAiEntityKind } from '@webonone/platform-embed'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@webonone/ui-kit'
import { CopyToAiMenuItem } from './CopyToAiMenuItem'

const PAGE_HEADER_MENU_TRIGGER_CLASSNAME =
  'h-9 w-9 shrink-0 rounded-md border border-[hsl(var(--glass-border))] bg-background text-muted-foreground hover:bg-accent hover:text-foreground'

type WebsiteLibraryDetailPageMenuProps = {
  kind: DesignAiEntityKind
  entityId: string
  entityLabel: string
  ariaLabel: string
}

export function WebsiteLibraryDetailPageMenu({
  kind,
  entityId,
  entityLabel,
  ariaLabel,
}: WebsiteLibraryDetailPageMenuProps) {
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
