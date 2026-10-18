import { sendPlatformAiMutation } from '@webonone/platform-embed'
import { getDataOrigin } from '@/features/data/utils/dataConfig'
import { getDesignOrigin } from '@/features/design/utils/designConfig'

function originOf(url: string): string | null {
  try {
    return new URL(url, typeof window !== 'undefined' ? window.location.href : undefined).origin
  } catch {
    return null
  }
}

function notifyPeerOrigin(peerOrigin: string | null, toolName: string): void {
  if (!peerOrigin || typeof document === 'undefined') {
    return
  }
  document.querySelectorAll('iframe').forEach((iframe) => {
    const src = iframe.getAttribute('src')
    if (!src) {
      return
    }
    const frameOrigin = originOf(src)
    if (frameOrigin !== peerOrigin) {
      return
    }
    sendPlatformAiMutation(iframe, peerOrigin, toolName)
  })
}

/** Tell open Data/Design iframes to refetch after a confirmed AI write. */
export function notifyPeerAiMutation(toolName: string): void {
  if (toolName === 'create_data_product_variant' && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('webonone:platform:ai-product-variants-changed'))
  }
  notifyPeerOrigin(originOf(getDataOrigin()), toolName)
  notifyPeerOrigin(originOf(getDesignOrigin()), toolName)
}
