import type { CSSProperties } from 'react'

export function themeFontFamilyStyle(family: string | undefined): CSSProperties | undefined {
  const trimmed = family?.trim()
  if (!trimmed) return undefined
  return { fontFamily: `"${trimmed}", sans-serif` }
}
