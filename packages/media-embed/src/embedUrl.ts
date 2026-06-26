import {
  MEDIA_MESSAGE_TYPES,
  type BuildMediaDialogUrlOptions,
  type BuildMediaEmbedUrlOptions,
  type BuildMediaSelectorUrlOptions,
  type BuildMediaUploadDialogUrlOptions,
  type BuildMediaViewerUrlOptions,
  type MediaParentMessage,
} from './types'

function appendCommonEmbedParams(url: URL, options: BuildMediaEmbedUrlOptions): void {
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
}

export function buildMediaEmbedUrl(options: BuildMediaEmbedUrlOptions): string {
  const url = new URL(options.baseUrl)
  appendCommonEmbedParams(url, options)
  return url.toString()
}

export function buildMediaUploadDialogUrl(options: BuildMediaUploadDialogUrlOptions): string {
  const url = new URL(options.baseUrl)
  appendCommonEmbedParams(url, options)
  if (options.mediaType) {
    url.searchParams.set('mediaType', options.mediaType)
  }
  if (options.crop) {
    url.searchParams.set('crop', 'true')
  }
  if (options.defaultCropAspect) {
    url.searchParams.set('defaultCropAspect', options.defaultCropAspect)
  }
  if (options.autoClose) {
    url.searchParams.set('autoClose', 'true')
  }
  return url.toString()
}

export function buildMediaSelectorUrl(options: BuildMediaSelectorUrlOptions): string {
  const url = new URL(options.baseUrl)
  appendCommonEmbedParams(url, options)
  url.searchParams.set('folderPath', options.folderPath)
  if (options.selectorUpload) {
    url.searchParams.set('selectorUpload', 'true')
  }
  if (options.cropAspectPresets?.length) {
    url.searchParams.set('cropAspectPresets', options.cropAspectPresets.join(','))
  }
  return url.toString()
}

export function buildMediaViewerUrl(options: BuildMediaViewerUrlOptions): string {
  const url = new URL(options.baseUrl)
  url.searchParams.set('parentOrigin', options.parentOrigin)
  url.searchParams.set('scope', options.scope)
  if (options.fileUrl) {
    url.searchParams.set('fileUrl', options.fileUrl)
  }
  if (options.mediaId) {
    url.searchParams.set('mediaId', options.mediaId)
  }
  if (options.mode) {
    url.searchParams.set('mode', options.mode)
  }
  if (options.folderPath) {
    url.searchParams.set('folderPath', options.folderPath)
  }
  return url.toString()
}

export function buildMediaDialogUrl(options: BuildMediaDialogUrlOptions): string {
  const url = new URL(options.baseUrl)
  appendCommonEmbedParams(url, options)
  url.searchParams.set('folderPath', options.folderPath)
  if (options.selectable) {
    url.searchParams.set('selectable', 'true')
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
