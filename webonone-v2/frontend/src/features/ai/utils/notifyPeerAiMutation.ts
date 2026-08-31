import { sendPlatformAiMutation } from '@webonone/platform-embed'
import { getDataOrigin } from '@/features/data/utils/dataConfig'

function originOf(url: string): string | null {
  try {
    return new URL(url, typeof window !== 'undefined' ? window.location.href : undefined).origin
  } catch {
    return null
  }
}

/** Tell the Data iframe (if it is open) to refetch the list for a confirmed AI write. */
export function notifyPeerAiMutation(toolName: string): void {
  if (toolName === 'create_data_product_variant' && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('webonone:platform:ai-product-variants-changed'))
  }
  const dataOrigin = originOf(getDataOrigin())
  if (!dataOrigin || typeof document === 'undefined') {
    return
  }
  document.querySelectorAll('iframe').forEach((iframe) => {
    const src = iframe.getAttribute('src')
    if (!src) {
      return
    }
    const frameOrigin = originOf(src)
    if (frameOrigin !== dataOrigin) {
      return
    }
    sendPlatformAiMutation(iframe, dataOrigin, toolName)
  })
}
