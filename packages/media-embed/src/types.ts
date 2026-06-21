export const MEDIA_MESSAGE_TYPES = {
  INIT: 'webonone:media:init',
  SELECT: 'webonone:media:select',
  UPLOADED: 'webonone:media:uploaded',
  DELETED: 'webonone:media:deleted',
  CANCEL: 'webonone:media:cancel',
} as const

export interface MediaItemDto {
  id: string
  url: string
  fileName: string
  mimeType: string
  sizeBytes: number
  width?: number | null
  height?: number | null
}

export interface MediaInitMessage {
  type: typeof MEDIA_MESSAGE_TYPES.INIT
  accessToken: string
}

export interface MediaSelectMessage {
  type: typeof MEDIA_MESSAGE_TYPES.SELECT
  scope: string
  items: MediaItemDto[]
}

export interface MediaUploadedMessage {
  type: typeof MEDIA_MESSAGE_TYPES.UPLOADED
  scope: string
  items: MediaItemDto[]
}

export interface MediaDeletedMessage {
  type: typeof MEDIA_MESSAGE_TYPES.DELETED
  scope: string
  ids: string[]
}

export interface MediaCancelMessage {
  type: typeof MEDIA_MESSAGE_TYPES.CANCEL
}

export type MediaEmbedMessage =
  | MediaInitMessage
  | MediaSelectMessage
  | MediaUploadedMessage
  | MediaDeletedMessage
  | MediaCancelMessage

export type MediaEmbedMode = 'single' | 'multiple'

export interface BuildMediaEmbedUrlOptions {
  baseUrl: string
  parentOrigin: string
  scope: string
  mode?: MediaEmbedMode
  accept?: string
  folderPath?: string
  maxFiles?: number
  maxSizeBytes?: number
}

export function isMediaEmbedMessage(data: unknown): data is MediaEmbedMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }
  const type = (data as { type: string }).type
  return Object.values(MEDIA_MESSAGE_TYPES).includes(type as (typeof MEDIA_MESSAGE_TYPES)[keyof typeof MEDIA_MESSAGE_TYPES])
}
