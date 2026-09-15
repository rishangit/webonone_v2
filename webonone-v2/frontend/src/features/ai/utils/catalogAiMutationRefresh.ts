import type { CatalogEntityKind } from '@/features/company-catalog/types/companyCatalog.types'

const CATALOG_WRITE_TOOL_RE =
  /^(create|update|delete)_catalog_item$|^link_catalog_item$|^from_library_catalog$|^fork_catalog_item$/

const GALLERY_KINDS = new Set<string>(['products', 'services', 'spaces'])

export function isCompanyCatalogWriteTool(toolName: string): boolean {
  return CATALOG_WRITE_TOOL_RE.test(toolName)
}

export function catalogKindFromToolArgs(
  args: Record<string, unknown> | undefined,
  fallbackKind: CatalogEntityKind | null,
): CatalogEntityKind | null {
  const raw = args?.kind
  if (typeof raw === 'string' && GALLERY_KINDS.has(raw)) {
    return raw as CatalogEntityKind
  }
  if (fallbackKind && GALLERY_KINDS.has(fallbackKind)) {
    return fallbackKind
  }
  return null
}

export function catalogIdFromToolArgs(args: Record<string, unknown> | undefined): string | null {
  const id = args?.id
  return typeof id === 'string' && id.length >= 8 ? id : null
}
