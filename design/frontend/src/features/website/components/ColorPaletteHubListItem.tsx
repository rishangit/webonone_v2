import type { ReactNode } from 'react'
import { ItemListContent, ItemListItem, itemListRowBodyClassName } from '@webonone/ui-kit'
import type { WebsiteColorLibraryPalette, WebsitePublishStatus } from '../types'
import { WebsitePublishStatusTag } from './WebsitePublishStatus'
import { ColorPaletteSwatchStrip } from './ColorPaletteSwatchStrip'

export function ColorPaletteHubListItem({
  name,
  palette,
  colorCountLabel,
  publishStatus,
  onOpen,
  menu,
}: {
  name: string
  palette: WebsiteColorLibraryPalette
  colorCountLabel: string
  publishStatus?: WebsitePublishStatus | null
  onOpen: () => void
  menu: ReactNode
}) {
  return (
    <ItemListItem>
      <ItemListContent>
        <button
          type="button"
          className={`${itemListRowBodyClassName} rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring`}
          onClick={onOpen}
        >
          <ColorPaletteSwatchStrip palette={palette} sizeClassName="h-9 w-9" />
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium">
              {name}
              <WebsitePublishStatusTag status={publishStatus} />
            </p>
            <p className="truncate text-sm text-muted-foreground">{colorCountLabel}</p>
          </div>
        </button>
      </ItemListContent>
      {menu}
    </ItemListItem>
  )
}
