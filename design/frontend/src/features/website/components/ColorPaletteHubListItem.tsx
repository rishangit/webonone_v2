import type { ReactNode } from 'react'
import { ItemListContent, ItemListItem, itemListRowBodyClassName } from '@webonone/ui-kit'
import type { WebsiteColorLibraryPalette } from '../types'
import { ColorPaletteSwatchStrip } from './ColorPaletteSwatchStrip'

export function ColorPaletteHubListItem({
  name,
  palette,
  colorCountLabel,
  onOpen,
  menu,
}: {
  name: string
  palette: WebsiteColorLibraryPalette
  colorCountLabel: string
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
            <p className="font-medium">{name}</p>
            <p className="truncate text-sm text-muted-foreground">{colorCountLabel}</p>
          </div>
        </button>
      </ItemListContent>
      {menu}
    </ItemListItem>
  )
}
