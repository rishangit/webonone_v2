import {
  MEDIA_MESSAGE_TYPES,
  type BuildMediaEmbedUrlOptions,
  type MediaParentMessage,
} from './types'

export function buildMediaEmbedUrl(options: BuildMediaEmbedUrlOptions): string {
  const url = new URL(options.baseUrl)
  url.searchParams.set('parentOrigin', options.parentOrigin)
  url.searchParams.set('scope', options.scope)
  if (options.mode) {
    url.searchParams.set('mode', options.mode)
  }
  if (options.accept) {
    url.searchParams.set('accept', options.accept)
  }
  if (options.folderPath) {
    url.searchParams.set('folderPath', options.folderPath)
  }
  if (options.maxFiles !== undefined) {
    url.searchParams.set('maxFiles', String(options.maxFiles))
  }
  if (options.maxSizeBytes !== undefined) {
    url.searchParams.set('maxSizeBytes', String(options.maxSizeBytes))
  }
  return url.toString()
}

export function sendMediaInit(
  iframe: HTMLIFrameElement,
  mediaOrigin: string,
  accessToken: string,
): void {
  iframe.contentWindow?.postMessage(
    { type: MEDIA_MESSAGE_TYPES.INIT, accessToken },
    mediaOrigin,
  )
}

export function sendMediaConfirm(iframe: HTMLIFrameElement, mediaOrigin: string): void {
  const message: MediaParentMessage = { type: MEDIA_MESSAGE_TYPES.CONFIRM }
  iframe.contentWindow?.postMessage(message, mediaOrigin)
}

export function isMediaParentMessage(data: unknown): data is MediaParentMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }
  const type = (data as { type: string }).type
  return type === MEDIA_MESSAGE_TYPES.INIT || type === MEDIA_MESSAGE_TYPES.CONFIRM
}
