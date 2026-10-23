import type { ColorPaletteSelectOption } from '@webonone/ui-kit'

export function colorSlotIndex(id: string): number | null {
  const index = Number(id)
  return Number.isInteger(index) && index >= 1 ? index : null
}

export function colorSlotId(index: number | null | undefined): string {
  return index != null && index >= 1 ? String(index) : ''
}

export function toColorPaletteSelectOptions(
  options: Array<{ id: string; name: string; palette: { colors: Array<{ value: string }> } }>,
): ColorPaletteSelectOption[] {
  return options.map((option) => ({
    id: option.id,
    name: option.name,
    colors: (option.palette?.colors ?? []).map((color) => color.value),
  }))
}
