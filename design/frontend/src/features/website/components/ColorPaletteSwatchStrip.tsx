import { COLOR_LIBRARY_PALETTE_KEYS } from '../utils/colorLibraryPalette'
import type { WebsiteColorLibraryPalette } from '../types'

export function ColorPaletteSwatchStrip({
  palette,
  sizeClassName = 'h-8 w-8',
}: {
  palette: WebsiteColorLibraryPalette
  sizeClassName?: string
}) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-md border border-[hsl(var(--glass-border))]" aria-hidden>
      {COLOR_LIBRARY_PALETTE_KEYS.map((key) => (
        <span key={key} className={sizeClassName} style={{ backgroundColor: palette[key] }} />
      ))}
    </div>
  )
}
