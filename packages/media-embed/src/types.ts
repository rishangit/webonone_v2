export const MEDIA_MESSAGE_TYPES = {
  INIT: 'webonone:media:init',
  CONFIRM: 'webonone:media:confirm',
  SELECT: 'webonone:media:select',
  SELECTION_CHANGE: 'webonone:media:selection-change',
  UPLOADED: 'webonone:media:uploaded',
  DELETED: 'webonone:media:deleted',
  CANCEL: 'webonone:media:cancel',
  VIEWER_CHANGED: 'webonone:media:viewer-changed',
} as const

export interface MediaItemDto {
  id: string
  url: string
  fileName: string
  mimeType: string
  sizeBytes: number
  width?: number | null
  height?: number | null
  folderPath?: string
  createdAt?: string
  updatedAt?: string
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

export interface MediaSelectionChangeMessage {
  type: typeof MEDIA_MESSAGE_TYPES.SELECTION_CHANGE
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

export interface MediaViewerChangedMessage {
  type: typeof MEDIA_MESSAGE_TYPES.VIEWER_CHANGED
  scope: string
  item: MediaItemDto
}

export interface MediaConfirmMessage {
  type: typeof MEDIA_MESSAGE_TYPES.CONFIRM
}

export type MediaEmbedMessage =
  | MediaInitMessage
  | MediaSelectMessage
  | MediaSelectionChangeMessage
  | MediaUploadedMessage
  | MediaDeletedMessage
  | MediaCancelMessage
  | MediaViewerChangedMessage

export type MediaParentMessage = MediaInitMessage | MediaConfirmMessage

export type MediaEmbedMode = 'single' | 'multiple'

export type MediaTypePreset = 'image' | 'pdf' | 'all'

export type CropAspectPreset = '1:1' | '1:2' | '2:1' | '3:2' | '4:3' | '16:9' | 'free'

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

export interface BuildMediaUploadDialogUrlOptions extends BuildMediaEmbedUrlOptions {
  mediaType?: MediaTypePreset
  crop?: boolean
  defaultCropAspect?: CropAspectPreset
  autoClose?: boolean
}

export interface BuildMediaSelectorUrlOptions extends BuildMediaEmbedUrlOptions {
  folderPath: string
  mode?: MediaEmbedMode
  selectorUpload?: boolean
  cropAspectPresets?: CropAspectPreset[]
}

export interface BuildMediaViewerUrlOptions {
  baseUrl: string
  parentOrigin: string
  scope: string
  fileUrl?: string
  mediaId?: string
  mode?: 'view' | 'edit'
  folderPath?: string
}

export interface BuildMediaDialogUrlOptions extends BuildMediaEmbedUrlOptions {
  folderPath: string
  selectable?: boolean
}

const IFRAME_TO_PARENT_TYPES = new Set<string>([
  MEDIA_MESSAGE_TYPES.SELECT,
  MEDIA_MESSAGE_TYPES.SELECTION_CHANGE,
  MEDIA_MESSAGE_TYPES.UPLOADED,
  MEDIA_MESSAGE_TYPES.DELETED,
  MEDIA_MESSAGE_TYPES.CANCEL,
  MEDIA_MESSAGE_TYPES.VIEWER_CHANGED,
])

export function isMediaEmbedMessage(data: unknown): data is MediaEmbedMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }
  const type = (data as { type: string }).type
  return IFRAME_TO_PARENT_TYPES.has(type)
}
