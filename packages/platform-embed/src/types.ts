export const PLATFORM_EMBED_QUERY = {
  EMBED: 'embed',
  EMBED_VALUE: 'platform',
  PARENT_ORIGIN: 'parentOrigin',
  SCOPE: 'scope',
  MODE: 'mode',
  DIALOG_REQUEST_ID: 'dialogRequestId',
} as const

/** Peer dialog routes must live under this prefix (host allowlist). */
export const PLATFORM_PEER_DIALOG_PATH_PREFIX = '/embed/dialogs/' as const

/** Mirrors `@webonone/ui-kit` CustomDialog size presets — kept local to avoid a ui-kit dependency. */
export type PlatformDialogSizePreset = 'small' | 'medium' | 'large' | 'xlarge' | 'auto'

export type IdentityUserPickerMode = 'single' | 'multiple'

export const PLATFORM_MESSAGE_TYPES = {
  INIT: 'webonone:platform:init',
  READY: 'webonone:platform:ready',
  CONTENT_READY: 'webonone:platform:content-ready',
  MEDIA_DIALOG_REQUEST: 'webonone:platform:media-dialog-request',
  MEDIA_DIALOG_RESULT: 'webonone:platform:media-dialog-result',
  MEDIA_DIALOG_CANCEL: 'webonone:platform:media-dialog-cancel',
  PEER_DIALOG_REQUEST: 'webonone:platform:peer-dialog-request',
  PEER_DIALOG_RESULT: 'webonone:platform:peer-dialog-result',
  PEER_DIALOG_CANCEL: 'webonone:platform:peer-dialog-cancel',
  /** Dialog iframe → shell: form saved successfully. */
  PEER_DIALOG_COMPLETE: 'webonone:platform:peer-dialog-complete',
  /** Shell → dialog iframe: footer primary button clicked. */
  PEER_DIALOG_SUBMIT: 'webonone:platform:peer-dialog-submit',
  /** Dialog iframe → shell: disable/enable host footer while saving. */
  PEER_DIALOG_BUSY: 'webonone:platform:peer-dialog-busy',
} as const

export const IDENTITY_USER_PICKER_MESSAGE_TYPES = {
  SELECT: 'webonone:identity:user-picker-select',
  SELECTION_CHANGE: 'webonone:identity:user-picker-selection-change',
  SET_SELECTION: 'webonone:identity:user-picker-set-selection',
  CANCEL: 'webonone:identity:user-picker-cancel',
} as const

export type DataTagPickerMode = 'single' | 'multiple'

export const DATA_TAG_PICKER_MESSAGE_TYPES = {
  SELECTION_CHANGE: 'webonone:data:tag-picker-selection-change',
  SET_SELECTION: 'webonone:data:tag-picker-set-selection',
  CANCEL: 'webonone:data:tag-picker-cancel',
  CREATE_REQUEST: 'webonone:data:tag-picker-create-request',
  CREATE_SUBMIT: 'webonone:data:tag-picker-create-submit',
  CREATED: 'webonone:data:tag-picker-created',
} as const

export type PlatformInitMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.INIT
  accessToken: string
}

export type PlatformReadyMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.READY
}

export type PlatformContentReadyMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.CONTENT_READY
}

export type IdentityUserPickerUser = {
  id: string
  displayName: string
  email: string
  role?: string
  avatarUrl?: string | null
}

export type IdentityUserPickerSelectMessage = {
  type: typeof IDENTITY_USER_PICKER_MESSAGE_TYPES.SELECT
  scope: string
  user: IdentityUserPickerUser
}

export type IdentityUserPickerSelectionChangeMessage = {
  type: typeof IDENTITY_USER_PICKER_MESSAGE_TYPES.SELECTION_CHANGE
  scope: string
  users: IdentityUserPickerUser[]
}

/** Parent -> Identity picker: seed currently selected users when the dialog opens. */
export type IdentityUserPickerSetSelectionMessage = {
  type: typeof IDENTITY_USER_PICKER_MESSAGE_TYPES.SET_SELECTION
  scope: string
  users: IdentityUserPickerUser[]
}

export type IdentityUserPickerCancelMessage = {
  type: typeof IDENTITY_USER_PICKER_MESSAGE_TYPES.CANCEL
  scope: string
  reason?: string
}

export type DataTagPickerTag = {
  id: string
  name: string
  color: string
}

export type DataTagPickerSelectionChangeMessage = {
  type: typeof DATA_TAG_PICKER_MESSAGE_TYPES.SELECTION_CHANGE
  scope: string
  tags: DataTagPickerTag[]
}

/** Parent -> Data picker: seed currently selected tags when the dialog opens. */
export type DataTagPickerSetSelectionMessage = {
  type: typeof DATA_TAG_PICKER_MESSAGE_TYPES.SET_SELECTION
  scope: string
  tags: DataTagPickerTag[]
}

export type DataTagPickerCancelMessage = {
  type: typeof DATA_TAG_PICKER_MESSAGE_TYPES.CANCEL
  scope: string
  reason?: string
}

/** Data picker -> parent: user asked to open the stacked "Add new tag" dialog. */
export type DataTagPickerCreateRequestMessage = {
  type: typeof DATA_TAG_PICKER_MESSAGE_TYPES.CREATE_REQUEST
  scope: string
}

/** Parent -> Data create form: submit the form (footer "Create" button). */
export type DataTagPickerCreateSubmitMessage = {
  type: typeof DATA_TAG_PICKER_MESSAGE_TYPES.CREATE_SUBMIT
  scope: string
}

/** Data create form -> parent: a new tag was created. */
export type DataTagPickerCreatedMessage = {
  type: typeof DATA_TAG_PICKER_MESSAGE_TYPES.CREATED
  scope: string
  tag: DataTagPickerTag
}

export type PlatformMediaDialogMode = 'single' | 'multiple'

export type PlatformMediaCropAspectPreset =
  | '1:1'
  | '1:2'
  | '2:1'
  | '3:2'
  | '4:3'
  | '16:9'
  | 'free'

export type PlatformMediaDialogItem = {
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

export type PlatformMediaDialogRequestMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.MEDIA_DIALOG_REQUEST
  requestId: string
  title?: string
  scope: string
  folderPath: string
  mode?: PlatformMediaDialogMode
  accept?: string
  selectorUpload?: boolean
  cropAspectPresets?: PlatformMediaCropAspectPreset[]
}

export type PlatformMediaDialogResultMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.MEDIA_DIALOG_RESULT
  requestId: string
  items: PlatformMediaDialogItem[]
}

export type PlatformMediaDialogCancelMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.MEDIA_DIALOG_CANCEL
  requestId: string
  reason?: string
}

export type PlatformPeerDialogRequestMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.PEER_DIALOG_REQUEST
  requestId: string
  path: string
  title: string
  sizeWidth: PlatformDialogSizePreset
  sizeHeight: PlatformDialogSizePreset
  description?: string
  /** Host CustomDialog footer Cancel label (default Cancel). */
  cancelLabel?: string
  /** Host CustomDialog footer primary action label. */
  submitLabel: string
}

export type PlatformPeerDialogResultMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.PEER_DIALOG_RESULT
  requestId: string
  payload?: unknown
}

export type PlatformPeerDialogCancelMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.PEER_DIALOG_CANCEL
  requestId: string
  reason?: string
}

/** Dialog iframe → WebOnOne shell after a successful save. */
export type PlatformPeerDialogCompleteMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.PEER_DIALOG_COMPLETE
  requestId: string
  payload?: unknown
}

/** Shell → dialog iframe when the host footer primary button is clicked. */
export type PlatformPeerDialogSubmitMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.PEER_DIALOG_SUBMIT
  requestId: string
}

/** Dialog iframe → shell to sync footer busy / label while saving. */
export type PlatformPeerDialogBusyMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.PEER_DIALOG_BUSY
  requestId: string
  busy: boolean
  submitLabel?: string
}

export type PlatformEmbedMessage =
  | PlatformInitMessage
  | PlatformReadyMessage
  | PlatformContentReadyMessage
  | IdentityUserPickerSelectMessage
  | IdentityUserPickerSelectionChangeMessage
  | IdentityUserPickerSetSelectionMessage
  | IdentityUserPickerCancelMessage
  | DataTagPickerSelectionChangeMessage
  | DataTagPickerSetSelectionMessage
  | DataTagPickerCancelMessage
  | DataTagPickerCreateRequestMessage
  | DataTagPickerCreateSubmitMessage
  | DataTagPickerCreatedMessage
  | PlatformMediaDialogRequestMessage
  | PlatformMediaDialogResultMessage
  | PlatformMediaDialogCancelMessage
  | PlatformPeerDialogRequestMessage
  | PlatformPeerDialogResultMessage
  | PlatformPeerDialogCancelMessage
  | PlatformPeerDialogCompleteMessage
  | PlatformPeerDialogSubmitMessage
  | PlatformPeerDialogBusyMessage

export type BuildPlatformEmbedUrlOptions = {
  peerOrigin: string
  path?: string
  parentOrigin: string
  scope?: string
  searchParams?: Record<string, string>
}

export function isPlatformInitMessage(data: unknown): data is PlatformInitMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as PlatformInitMessage
  return message.type === PLATFORM_MESSAGE_TYPES.INIT && typeof message.accessToken === 'string'
}

export function isPlatformReadyMessage(data: unknown): data is PlatformReadyMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  return (data as PlatformReadyMessage).type === PLATFORM_MESSAGE_TYPES.READY
}

export function isPlatformContentReadyMessage(
  data: unknown,
): data is PlatformContentReadyMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  return (data as PlatformContentReadyMessage).type === PLATFORM_MESSAGE_TYPES.CONTENT_READY
}

function hasStringProperty(data: Record<string, unknown>, property: string): boolean {
  return typeof data[property] === 'string' && data[property].length > 0
}

function isIdentityUserPickerUser(data: unknown): data is IdentityUserPickerUser {
  if (!data || typeof data !== 'object') {
    return false
  }

  const user = data as Record<string, unknown>
  return (
    hasStringProperty(user, 'id') &&
    hasStringProperty(user, 'displayName') &&
    hasStringProperty(user, 'email') &&
    (user.role === undefined || typeof user.role === 'string') &&
    (user.avatarUrl === undefined ||
      user.avatarUrl === null ||
      typeof user.avatarUrl === 'string')
  )
}

export function isIdentityUserPickerSelectMessage(
  data: unknown,
): data is IdentityUserPickerSelectMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === IDENTITY_USER_PICKER_MESSAGE_TYPES.SELECT &&
    hasStringProperty(message, 'scope') &&
    isIdentityUserPickerUser(message.user)
  )
}

export function isIdentityUserPickerSelectionChangeMessage(
  data: unknown,
): data is IdentityUserPickerSelectionChangeMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === IDENTITY_USER_PICKER_MESSAGE_TYPES.SELECTION_CHANGE &&
    hasStringProperty(message, 'scope') &&
    Array.isArray(message.users) &&
    message.users.every(isIdentityUserPickerUser)
  )
}

export function isIdentityUserPickerSetSelectionMessage(
  data: unknown,
): data is IdentityUserPickerSetSelectionMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === IDENTITY_USER_PICKER_MESSAGE_TYPES.SET_SELECTION &&
    hasStringProperty(message, 'scope') &&
    Array.isArray(message.users) &&
    message.users.every(isIdentityUserPickerUser)
  )
}

export function isIdentityUserPickerCancelMessage(
  data: unknown,
): data is IdentityUserPickerCancelMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === IDENTITY_USER_PICKER_MESSAGE_TYPES.CANCEL &&
    hasStringProperty(message, 'scope') &&
    (message.reason === undefined || typeof message.reason === 'string')
  )
}

function isDataTagPickerTag(data: unknown): data is DataTagPickerTag {
  if (!data || typeof data !== 'object') {
    return false
  }

  const tag = data as Record<string, unknown>
  return (
    hasStringProperty(tag, 'id') &&
    hasStringProperty(tag, 'name') &&
    hasStringProperty(tag, 'color')
  )
}

export function isDataTagPickerSelectionChangeMessage(
  data: unknown,
): data is DataTagPickerSelectionChangeMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === DATA_TAG_PICKER_MESSAGE_TYPES.SELECTION_CHANGE &&
    hasStringProperty(message, 'scope') &&
    Array.isArray(message.tags) &&
    message.tags.every(isDataTagPickerTag)
  )
}

export function isDataTagPickerSetSelectionMessage(
  data: unknown,
): data is DataTagPickerSetSelectionMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === DATA_TAG_PICKER_MESSAGE_TYPES.SET_SELECTION &&
    hasStringProperty(message, 'scope') &&
    Array.isArray(message.tags) &&
    message.tags.every(isDataTagPickerTag)
  )
}

export function isDataTagPickerCancelMessage(
  data: unknown,
): data is DataTagPickerCancelMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === DATA_TAG_PICKER_MESSAGE_TYPES.CANCEL &&
    hasStringProperty(message, 'scope') &&
    (message.reason === undefined || typeof message.reason === 'string')
  )
}

export function isDataTagPickerCreateRequestMessage(
  data: unknown,
): data is DataTagPickerCreateRequestMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === DATA_TAG_PICKER_MESSAGE_TYPES.CREATE_REQUEST &&
    hasStringProperty(message, 'scope')
  )
}

export function isDataTagPickerCreateSubmitMessage(
  data: unknown,
): data is DataTagPickerCreateSubmitMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === DATA_TAG_PICKER_MESSAGE_TYPES.CREATE_SUBMIT &&
    hasStringProperty(message, 'scope')
  )
}

export function isDataTagPickerCreatedMessage(
  data: unknown,
): data is DataTagPickerCreatedMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === DATA_TAG_PICKER_MESSAGE_TYPES.CREATED &&
    hasStringProperty(message, 'scope') &&
    isDataTagPickerTag(message.tag)
  )
}

function isPlatformMediaDialogItem(data: unknown): data is PlatformMediaDialogItem {
  if (!data || typeof data !== 'object') {
    return false
  }

  const item = data as Record<string, unknown>
  return (
    hasStringProperty(item, 'id') &&
    hasStringProperty(item, 'url') &&
    hasStringProperty(item, 'fileName') &&
    hasStringProperty(item, 'mimeType') &&
    typeof item.sizeBytes === 'number'
  )
}

export function isPlatformMediaDialogRequestMessage(
  data: unknown,
): data is PlatformMediaDialogRequestMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === PLATFORM_MESSAGE_TYPES.MEDIA_DIALOG_REQUEST &&
    hasStringProperty(message, 'requestId') &&
    hasStringProperty(message, 'scope') &&
    hasStringProperty(message, 'folderPath')
  )
}

export function isPlatformMediaDialogResultMessage(
  data: unknown,
): data is PlatformMediaDialogResultMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === PLATFORM_MESSAGE_TYPES.MEDIA_DIALOG_RESULT &&
    hasStringProperty(message, 'requestId') &&
    Array.isArray(message.items) &&
    message.items.every(isPlatformMediaDialogItem)
  )
}

export function isPlatformMediaDialogCancelMessage(
  data: unknown,
): data is PlatformMediaDialogCancelMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === PLATFORM_MESSAGE_TYPES.MEDIA_DIALOG_CANCEL &&
    hasStringProperty(message, 'requestId')
  )
}

const PLATFORM_DIALOG_SIZE_PRESETS: ReadonlySet<string> = new Set([
  'small',
  'medium',
  'large',
  'xlarge',
  'auto',
])

export function isPlatformDialogSizePreset(value: unknown): value is PlatformDialogSizePreset {
  return typeof value === 'string' && PLATFORM_DIALOG_SIZE_PRESETS.has(value)
}

/** Relative path under `/embed/dialogs/` with no traversal. */
export function isAllowedPlatformPeerDialogPath(path: string): boolean {
  if (typeof path !== 'string' || !path.startsWith(PLATFORM_PEER_DIALOG_PATH_PREFIX)) {
    return false
  }
  if (path.includes('..') || path.includes('//') || path.includes('\\')) {
    return false
  }
  return path.length > PLATFORM_PEER_DIALOG_PATH_PREFIX.length
}

export function isPlatformPeerDialogRequestMessage(
  data: unknown,
): data is PlatformPeerDialogRequestMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === PLATFORM_MESSAGE_TYPES.PEER_DIALOG_REQUEST &&
    hasStringProperty(message, 'requestId') &&
    hasStringProperty(message, 'path') &&
    hasStringProperty(message, 'title') &&
    hasStringProperty(message, 'submitLabel') &&
    isAllowedPlatformPeerDialogPath(message.path as string) &&
    isPlatformDialogSizePreset(message.sizeWidth) &&
    isPlatformDialogSizePreset(message.sizeHeight) &&
    (message.description === undefined || typeof message.description === 'string') &&
    (message.cancelLabel === undefined || typeof message.cancelLabel === 'string')
  )
}

export function isPlatformPeerDialogResultMessage(
  data: unknown,
): data is PlatformPeerDialogResultMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === PLATFORM_MESSAGE_TYPES.PEER_DIALOG_RESULT &&
    hasStringProperty(message, 'requestId')
  )
}

export function isPlatformPeerDialogCancelMessage(
  data: unknown,
): data is PlatformPeerDialogCancelMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === PLATFORM_MESSAGE_TYPES.PEER_DIALOG_CANCEL &&
    hasStringProperty(message, 'requestId') &&
    (message.reason === undefined || typeof message.reason === 'string')
  )
}

export function isPlatformPeerDialogCompleteMessage(
  data: unknown,
): data is PlatformPeerDialogCompleteMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === PLATFORM_MESSAGE_TYPES.PEER_DIALOG_COMPLETE &&
    hasStringProperty(message, 'requestId')
  )
}

export function isPlatformPeerDialogSubmitMessage(
  data: unknown,
): data is PlatformPeerDialogSubmitMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === PLATFORM_MESSAGE_TYPES.PEER_DIALOG_SUBMIT &&
    hasStringProperty(message, 'requestId')
  )
}

export function isPlatformPeerDialogBusyMessage(
  data: unknown,
): data is PlatformPeerDialogBusyMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === PLATFORM_MESSAGE_TYPES.PEER_DIALOG_BUSY &&
    hasStringProperty(message, 'requestId') &&
    typeof message.busy === 'boolean' &&
    (message.submitLabel === undefined || typeof message.submitLabel === 'string')
  )
}
