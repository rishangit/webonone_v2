/** Curated readable colors for new company tags (avoid near-white / muddy greys). */
const TAG_COLOR_PALETTE = [
  '#3366FF',
  '#16A34A',
  '#DC2626',
  '#D97706',
  '#7C3AED',
  '#0891B2',
  '#DB2777',
  '#CA8A04',
  '#4F46E5',
  '#059669',
  '#EA580C',
  '#9333EA',
  '#0284C7',
  '#BE123C',
  '#0D9488',
  '#C026D3',
] as const

/** Returns a random `#RRGGBB` from the tag palette for new-tag defaults. */
export function randomTagColor(): string {
  const index = Math.floor(Math.random() * TAG_COLOR_PALETTE.length)
  return TAG_COLOR_PALETTE[index]!
}
