import type { WebsiteColorLibraryPalette } from '../types'
import { paletteToSwatches } from '../utils/colorLibraryPalette'

export function ColorPaletteSwatchStrip({
  palette,
  sizeClassName = 'h-8 w-8',
}: {
  palette: WebsiteColorLibraryPalette
  sizeClassName?: string
}) {
  const swatches = paletteToSwatches(palette)
  return (
    <div className="flex shrink-0 overflow-hidden rounded-md border border-[hsl(var(--glass-border))]" aria-hidden>
      {swatches.map((value, index) => (
        <span key={`${value}-${index}`} className={sizeClassName} style={{ backgroundColor: value }} />
      ))}
    </div>
  )
}
