const aiMutationListeners = new Set<(toolName: string) => void>()

export function subscribeAiCatalogMutation(listener: (toolName: string) => void): () => void {
  aiMutationListeners.add(listener)
  return () => aiMutationListeners.delete(listener)
}

export function emitAiProductVariantsChanged(): void {
  aiMutationListeners.forEach((listener) => listener('create_data_product_variant'))
}

export function emitAiCompanyCatalogRefresh(toolName: string): void {
  aiMutationListeners.forEach((listener) => listener(toolName))
}
