export const AI_PRODUCT_VARIANTS_CHANGED_EVENT = 'webonone:platform:ai-product-variants-changed'

export function dispatchAiProductVariantsChanged(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.dispatchEvent(new CustomEvent(AI_PRODUCT_VARIANTS_CHANGED_EVENT))
}
