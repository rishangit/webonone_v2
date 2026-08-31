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

/**
 * Sentinel path for shell-hosted AlertDialog confirms (`variant: 'alert'`).
 * Allowlisted only — never loaded as an iframe body.
 */
export const PLATFORM_ALERT_CONFIRM_PATH = '/embed/dialogs/confirm-delete' as const

/** Mirrors `@webonone/ui-kit` CustomDialog size presets — kept local to avoid a ui-kit dependency. */
export type PlatformDialogSizePreset = 'small' | 'medium' | 'large' | 'xlarge' | 'auto'

/** Host chrome: CustomDialog+iframe body vs shell AlertDialog (no iframe). */
export type PlatformPeerDialogVariant = 'dialog' | 'alert'

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
  /** Shell → dialog iframe: footer secondary button clicked (e.g. Previous). */
  PEER_DIALOG_SECONDARY: 'webonone:platform:peer-dialog-secondary',
  /** Dialog iframe → shell: disable/enable host footer while saving. */
  PEER_DIALOG_BUSY: 'webonone:platform:peer-dialog-busy',
  /**
   * Outer dialog iframe → shell: open a stacked sibling create/form dialog
   * (SelectTag / media-crop pattern — chrome in parent document).
   */
  PEER_DIALOG_NESTED_REQUEST: 'webonone:platform:peer-dialog-nested-request',
  /** Shell → outer dialog iframe: nested sibling closed without completing. */
  PEER_DIALOG_NESTED_CANCEL: 'webonone:platform:peer-dialog-nested-cancel',
  /** Shell → outer dialog iframe: nested sibling completed with payload. */
  PEER_DIALOG_NESTED_RESULT: 'webonone:platform:peer-dialog-nested-result',
  /** Peer iframe → shell: request shell SPA navigation (e.g. Data detail `/data/{entity}/:id`). */
  NAVIGATE: 'webonone:platform:navigate',
  /** Shell → peer iframe: a confirmed AI write succeeded; refresh matching lists. */
  AI_MUTATION: 'webonone:platform:ai-mutation',
  /** Peer iframe → shell: attach a Data entity to the AI assistant composer. */
  AI_ENTITY_CONTEXT: 'webonone:platform:ai-entity-context',
} as const

export const DATA_AI_ENTITY_KINDS = [
  'product',
  'service',
  'space',
  'tag',
  'unit',
  'attribute',
] as const

export type DataAiEntityKind = (typeof DATA_AI_ENTITY_KINDS)[number]

/** Company catalog entities attached to the WebOnOne AI assistant (products, services, spaces). */
export const CATALOG_AI_ENTITY_KINDS = ['product', 'service', 'space'] as const

export type CatalogAiEntityKind = (typeof CATALOG_AI_ENTITY_KINDS)[number]

export type DataAiEntityRef = {
  service: 'data'
  kind: DataAiEntityKind
  id: string
  label: string
}

export type WebononeAiEntityRef = {
  service: 'webonone'
  kind: CatalogAiEntityKind
  id: string
  label: string
}

export type PlatformAiEntityRef = DataAiEntityRef | WebononeAiEntityRef

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

/** Identity login iframe → parent (e.g. WebOnOne `/login` host). */
export const AUTH_MESSAGE_TYPES = {
  SUCCESS: 'webonone:auth:success',
  CANCEL: 'webonone:auth:cancel',
  NAVIGATE: 'webonone:auth:navigate',
} as const

/** WebOnOne silent SSO iframe → public website parent. */
export const WEBSITE_SSO_MESSAGE_TYPES = {
  SESSION: 'webonone:website-sso:session',
  NONE: 'webonone:website-sso:none',
} as const

/** Identity silent SSO iframe → consumer parent (Website, WebOnOne, …). */
export const IDENTITY_SSO_MESSAGE_TYPES = {
  SESSION: 'webonone:identity-sso:session',
  NONE: 'webonone:identity-sso:none',
} as const

/** Identity clear-embed-session iframe → consumer parent after clearing partitioned storage. */
export const IDENTITY_CLEAR_MESSAGE_TYPES = {
  CLEARED: 'webonone:identity-session:cleared',
} as const

export type AuthSuccessUser = {
  id: string
  email: string
  displayName: string
  avatarUrl?: string | null
  /** Preferred UI locale (`en` | `si`); optional for backward compatibility. */
  locale?: string | null
}

export type AuthSuccessMessage = {
  type: typeof AUTH_MESSAGE_TYPES.SUCCESS
  accessToken: string
  expiresIn: number
  user: AuthSuccessUser
  embedId?: string
}

export type AuthCancelMessage = {
  type: typeof AUTH_MESSAGE_TYPES.CANCEL
  embedId?: string
}

/** Identity auth iframe → parent: navigate guest auth route (login, register, forgot, …). */
export type AuthNavigateMessage = {
  type: typeof AUTH_MESSAGE_TYPES.NAVIGATE
  pathname: string
  search?: string
}

export type WebsiteSsoSessionMessage = {
  type: typeof WEBSITE_SSO_MESSAGE_TYPES.SESSION
  accessToken: string
  user: AuthSuccessUser
}

export type WebsiteSsoNoneMessage = {
  type: typeof WEBSITE_SSO_MESSAGE_TYPES.NONE
}

export type IdentitySsoSessionMessage = {
  type: typeof IDENTITY_SSO_MESSAGE_TYPES.SESSION
  accessToken: string
  user: AuthSuccessUser
}

export type IdentitySsoNoneMessage = {
  type: typeof IDENTITY_SSO_MESSAGE_TYPES.NONE
}

export type IdentitySessionClearedMessage = {
  type: typeof IDENTITY_CLEAR_MESSAGE_TYPES.CLEARED
}

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

/** Peer iframe → shell: navigate the parent SPA to a relative path. */
export type PlatformNavigateMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.NAVIGATE
  path: string
  /**
   * Peer already updated its own SPA route. Shell should sync the address bar
   * without reloading the iframe `src` (avoids double load / remount).
   */
  clientNavigated?: boolean
}

/** Shell → peer iframe: confirmed AI tool write; peer should refetch the matching list. */
export type PlatformAiMutationMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.AI_MUTATION
  toolName: string
}

/** Peer iframe → shell: attach Data library entities to the AI assistant. */
export type PlatformAiEntityContextMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.AI_ENTITY_CONTEXT
  entity: PlatformAiEntityRef
  /** When set, all entities are attached (entity is included for backward compatibility). */
  entities?: PlatformAiEntityRef[]
  /** Optional composer text appended after entity tags. */
  composerText?: string
  openAssistant?: boolean
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
  /**
   * Navigation ceiling for the Media selector breadcrumbs. When omitted,
   * Media locks navigation to `folderPath`.
   */
  scopedRoot?: string
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
  /**
   * Host chrome variant.
   * - `dialog` (default): CustomDialog + peer `/embed/dialogs/…` iframe body
   * - `alert`: shell AlertDialog only (no iframe) — strict destructive confirms
   */
  variant?: PlatformPeerDialogVariant
  /** Host CustomDialog footer Cancel label (default Cancel). */
  cancelLabel?: string
  /**
   * Optional host footer secondary action (e.g. wizard Previous).
   * Shown between Cancel and primary when set.
   */
  secondaryLabel?: string
  /**
   * Host CustomDialog footer primary action label.
   * Omit or pass `null` for Close-only footers (no primary button).
   */
  submitLabel?: string | null
  /**
   * Optional origin for the dialog body iframe.
   * When set (and allowlisted by the host), the body loads from this peer instead
   * of the requesting frame's origin — e.g. Identity opening a Design fill dialog.
   */
  bodyOrigin?: string
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

/** Shell → dialog iframe when the host footer secondary button is clicked. */
export type PlatformPeerDialogSecondaryMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.PEER_DIALOG_SECONDARY
  requestId: string
}

/** Dialog iframe → shell to sync footer busy / chrome while saving or stepping. */
export type PlatformPeerDialogBusyMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.PEER_DIALOG_BUSY
  requestId: string
  busy: boolean
  submitLabel?: string
  /** Update host description (wizard step copy). */
  description?: string
  /**
   * Update host secondary footer label.
   * `null` hides the secondary button; omit to leave unchanged.
   */
  secondaryLabel?: string | null
}

/** Outer dialog iframe → shell: open stacked sibling dialog (create-from-picker). */
export type PlatformPeerDialogNestedRequestMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.PEER_DIALOG_NESTED_REQUEST
  /** Outer (parent) peer-dialog requestId currently open on the host. */
  parentRequestId: string
  /** Nested dialog requestId (used for submit/complete/busy). */
  requestId: string
  path: string
  title: string
  sizeWidth: PlatformDialogSizePreset
  sizeHeight: PlatformDialogSizePreset
  description?: string
  cancelLabel?: string
  secondaryLabel?: string
  /**
   * Host footer primary label.
   * Omit or pass `null` for Close-only footers (no primary button).
   */
  submitLabel?: string | null
}

/** Shell → outer dialog iframe when nested sibling is cancelled. */
export type PlatformPeerDialogNestedCancelMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.PEER_DIALOG_NESTED_CANCEL
  parentRequestId: string
  requestId: string
  reason?: string
}

/** Shell → outer dialog iframe when nested sibling completes. */
export type PlatformPeerDialogNestedResultMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.PEER_DIALOG_NESTED_RESULT
  parentRequestId: string
  requestId: string
  payload?: unknown
}

export type PlatformEmbedMessage =
  | PlatformInitMessage
  | PlatformReadyMessage
  | PlatformContentReadyMessage
  | PlatformNavigateMessage
  | PlatformAiMutationMessage
  | PlatformAiEntityContextMessage
  | AuthSuccessMessage
  | AuthCancelMessage
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
  | PlatformPeerDialogSecondaryMessage
  | PlatformPeerDialogBusyMessage
  | PlatformPeerDialogNestedRequestMessage
  | PlatformPeerDialogNestedCancelMessage
  | PlatformPeerDialogNestedResultMessage

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

export function isPlatformAiMutationMessage(data: unknown): data is PlatformAiMutationMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }
  const message = data as PlatformAiMutationMessage
  return (
    message.type === PLATFORM_MESSAGE_TYPES.AI_MUTATION &&
    typeof message.toolName === 'string' &&
    message.toolName.length > 0
  )
}

function isPlatformAiEntityRef(data: unknown): data is PlatformAiEntityRef {
  if (!data || typeof data !== 'object') {
    return false
  }
  const entity = data as Record<string, unknown>
  const hasValidId =
    typeof entity.id === 'string' && entity.id.length >= 8 && entity.id.length <= 32
  const hasValidLabel =
    typeof entity.label === 'string' && entity.label.trim().length > 0
  if (!hasValidId || !hasValidLabel || typeof entity.kind !== 'string') {
    return false
  }
  if (entity.service === 'data') {
    return DATA_AI_ENTITY_KINDS.includes(entity.kind as DataAiEntityKind)
  }
  if (entity.service === 'webonone') {
    return CATALOG_AI_ENTITY_KINDS.includes(entity.kind as CatalogAiEntityKind)
  }
  return false
}

export function isPlatformAiEntityContextMessage(
  data: unknown,
): data is PlatformAiEntityContextMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }
  const message = data as PlatformAiEntityContextMessage
  if (message.type !== PLATFORM_MESSAGE_TYPES.AI_ENTITY_CONTEXT) {
    return false
  }
  if (!isPlatformAiEntityRef(message.entity)) {
    return false
  }
  if (message.openAssistant !== undefined && typeof message.openAssistant !== 'boolean') {
    return false
  }
  if (message.composerText !== undefined && typeof message.composerText !== 'string') {
    return false
  }
  if (message.entities !== undefined) {
    if (!Array.isArray(message.entities) || message.entities.length === 0) {
      return false
    }
    if (!message.entities.every((entry) => isPlatformAiEntityRef(entry))) {
      return false
    }
  }
  return true
}

export function isPlatformNavigateMessage(data: unknown): data is PlatformNavigateMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as PlatformNavigateMessage
  return (
    message.type === PLATFORM_MESSAGE_TYPES.NAVIGATE &&
    typeof message.path === 'string' &&
    message.path.startsWith('/') &&
    !message.path.startsWith('//')
  )
}

function isAuthSuccessUser(data: unknown): data is AuthSuccessUser {
  if (!data || typeof data !== 'object') {
    return false
  }
  const user = data as Record<string, unknown>
  return (
    typeof user.id === 'string' &&
    user.id.length > 0 &&
    typeof user.email === 'string' &&
    user.email.length > 0 &&
    typeof user.displayName === 'string' &&
    user.displayName.length > 0 &&
    (user.avatarUrl === undefined ||
      user.avatarUrl === null ||
      typeof user.avatarUrl === 'string') &&
    (user.locale === undefined || user.locale === null || typeof user.locale === 'string')
  )
}

export function isAuthSuccessMessage(data: unknown): data is AuthSuccessMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === AUTH_MESSAGE_TYPES.SUCCESS &&
    typeof message.accessToken === 'string' &&
    message.accessToken.length > 0 &&
    typeof message.expiresIn === 'number' &&
    Number.isFinite(message.expiresIn) &&
    isAuthSuccessUser(message.user) &&
    (message.embedId === undefined || typeof message.embedId === 'string')
  )
}

export function isAuthCancelMessage(data: unknown): data is AuthCancelMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === AUTH_MESSAGE_TYPES.CANCEL &&
    (message.embedId === undefined || typeof message.embedId === 'string')
  )
}

export function isAuthNavigateMessage(data: unknown): data is AuthNavigateMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === AUTH_MESSAGE_TYPES.NAVIGATE &&
    typeof message.pathname === 'string' &&
    message.pathname.startsWith('/') &&
    (message.search === undefined ||
      (typeof message.search === 'string' && message.search.startsWith('?')))
  )
}

export function isWebsiteSsoSessionMessage(data: unknown): data is WebsiteSsoSessionMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === WEBSITE_SSO_MESSAGE_TYPES.SESSION &&
    typeof message.accessToken === 'string' &&
    message.accessToken.length > 0 &&
    isAuthSuccessUser(message.user)
  )
}

export function isWebsiteSsoNoneMessage(data: unknown): data is WebsiteSsoNoneMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  return (data as Record<string, unknown>).type === WEBSITE_SSO_MESSAGE_TYPES.NONE
}

export function isIdentitySsoSessionMessage(data: unknown): data is IdentitySsoSessionMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === IDENTITY_SSO_MESSAGE_TYPES.SESSION &&
    typeof message.accessToken === 'string' &&
    message.accessToken.length > 0 &&
    isAuthSuccessUser(message.user)
  )
}

export function isIdentitySsoNoneMessage(data: unknown): data is IdentitySsoNoneMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  return (data as Record<string, unknown>).type === IDENTITY_SSO_MESSAGE_TYPES.NONE
}

export function isIdentitySessionClearedMessage(
  data: unknown,
): data is IdentitySessionClearedMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  return (data as Record<string, unknown>).type === IDENTITY_CLEAR_MESSAGE_TYPES.CLEARED
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
    hasStringProperty(message, 'folderPath') &&
    (message.scopedRoot === undefined || hasStringProperty(message, 'scopedRoot'))
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
    isAllowedPlatformPeerDialogPath(message.path as string) &&
    isPlatformDialogSizePreset(message.sizeWidth) &&
    isPlatformDialogSizePreset(message.sizeHeight) &&
    (message.variant === undefined ||
      message.variant === 'dialog' ||
      message.variant === 'alert') &&
    (message.description === undefined || typeof message.description === 'string') &&
    (message.cancelLabel === undefined || typeof message.cancelLabel === 'string') &&
    (message.secondaryLabel === undefined || typeof message.secondaryLabel === 'string') &&
    (message.submitLabel === undefined ||
      message.submitLabel === null ||
      typeof message.submitLabel === 'string') &&
    (message.bodyOrigin === undefined || typeof message.bodyOrigin === 'string')
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

export function isPlatformPeerDialogSecondaryMessage(
  data: unknown,
): data is PlatformPeerDialogSecondaryMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === PLATFORM_MESSAGE_TYPES.PEER_DIALOG_SECONDARY &&
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
    (message.submitLabel === undefined || typeof message.submitLabel === 'string') &&
    (message.description === undefined || typeof message.description === 'string') &&
    (message.secondaryLabel === undefined ||
      message.secondaryLabel === null ||
      typeof message.secondaryLabel === 'string')
  )
}

export function isPlatformPeerDialogNestedRequestMessage(
  data: unknown,
): data is PlatformPeerDialogNestedRequestMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === PLATFORM_MESSAGE_TYPES.PEER_DIALOG_NESTED_REQUEST &&
    hasStringProperty(message, 'parentRequestId') &&
    hasStringProperty(message, 'requestId') &&
    hasStringProperty(message, 'path') &&
    hasStringProperty(message, 'title') &&
    isAllowedPlatformPeerDialogPath(message.path as string) &&
    isPlatformDialogSizePreset(message.sizeWidth) &&
    isPlatformDialogSizePreset(message.sizeHeight) &&
    (message.description === undefined || typeof message.description === 'string') &&
    (message.cancelLabel === undefined || typeof message.cancelLabel === 'string') &&
    (message.secondaryLabel === undefined || typeof message.secondaryLabel === 'string') &&
    (message.submitLabel === undefined ||
      message.submitLabel === null ||
      typeof message.submitLabel === 'string')
  )
}

export function isPlatformPeerDialogNestedCancelMessage(
  data: unknown,
): data is PlatformPeerDialogNestedCancelMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === PLATFORM_MESSAGE_TYPES.PEER_DIALOG_NESTED_CANCEL &&
    hasStringProperty(message, 'parentRequestId') &&
    hasStringProperty(message, 'requestId') &&
    (message.reason === undefined || typeof message.reason === 'string')
  )
}

export function isPlatformPeerDialogNestedResultMessage(
  data: unknown,
): data is PlatformPeerDialogNestedResultMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false
  }

  const message = data as Record<string, unknown>
  return (
    message.type === PLATFORM_MESSAGE_TYPES.PEER_DIALOG_NESTED_RESULT &&
    hasStringProperty(message, 'parentRequestId') &&
    hasStringProperty(message, 'requestId')
  )
}
