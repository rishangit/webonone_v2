import {
  emitAiCompanyCatalogRefresh,
  emitAiProductVariantsChanged,
} from '@/features/ai/utils/aiCatalogEvents'

const CATALOG_WRITE_TOOL_RE =
  /^(create|update|delete)_catalog_item$|^link_catalog_item$|^from_library_catalog$|^fork_catalog_item$/

export function isCompanyCatalogWriteTool(toolName: string): boolean {
  return CATALOG_WRITE_TOOL_RE.test(toolName)
}

export function notifyAiCatalogMutation(toolName: string): void {
  if (
    toolName === 'create_data_product_variant' ||
    toolName === 'delete_data_product_variant'
  ) {
    emitAiProductVariantsChanged()
  }
  if (isCompanyCatalogWriteTool(toolName) || /^create_data_|^update_data_|^delete_data_/.test(toolName)) {
    emitAiCompanyCatalogRefresh(toolName)
  }
}
