import {
  AUTH_MESSAGE_TYPES,
  DATA_TAG_PICKER_MESSAGE_TYPES,
  IDENTITY_USER_PICKER_MESSAGE_TYPES,
  IDENTITY_CLEAR_MESSAGE_TYPES,
  IDENTITY_SSO_MESSAGE_TYPES,
  PLATFORM_EMBED_QUERY,
  PLATFORM_MESSAGE_TYPES,
  WEBSITE_SSO_MESSAGE_TYPES,
  isIdentitySessionClearedMessage,
} from './types'
import type {
  AuthCancelMessage,
  AuthNavigateMessage,
  AuthSuccessMessage,
  AuthSuccessUser,
  IdentitySessionClearedMessage,
  IdentitySsoNoneMessage,
  IdentitySsoSessionMessage,
  WebsiteSsoNoneMessage,
  WebsiteSsoSessionMessage,
  BuildPlatformEmbedUrlOptions,
  DataTagPickerCancelMessage,
  DataTagPickerCreatedMessage,
  DataTagPickerCreateRequestMessage,
  DataTagPickerCreateSubmitMessage,
  DataTagPickerMode,
  DataTagPickerSelectionChangeMessage,
  DataTagPickerSetSelectionMessage,
  DataTagPickerTag,
  IdentityUserPickerCancelMessage,
  IdentityUserPickerMode,
  IdentityUserPickerSelectMessage,
  IdentityUserPickerSelectionChangeMessage,
  IdentityUserPickerSetSelectionMessage,
  IdentityUserPickerUser,
  PlatformMediaDialogCancelMessage,
  PlatformMediaDialogItem,
  PlatformMediaDialogRequestMessage,
  PlatformMediaDialogResultMessage,
  PlatformNavigateMessage,
  PlatformAiMutationMessage,
  PlatformPeerDialogCancelMessage,
  PlatformPeerDialogCompleteMessage,
  PlatformPeerDialogBusyMessage,
  PlatformPeerDialogNestedCancelMessage,
  PlatformPeerDialogNestedRequestMessage,
  PlatformPeerDialogNestedResultMessage,
  PlatformPeerDialogRequestMessage,
  PlatformPeerDialogResultMessage,
  PlatformPeerDialogSecondaryMessage,
  PlatformPeerDialogSubmitMessage,
} from './types'

export type BuildIdentityUserPickerUrlOptions = {
  identityOrigin: string
  parentOrigin: string
  scope: string
  path?: string
  mode?: IdentityUserPickerMode
}

export type BuildDataTagPickerUrlOptions = {
  dataOrigin: string
  parentOrigin: string
  scope: string
  path?: string
  mode?: DataTagPickerMode
}

export type BuildDataTagCreateUrlOptions = {
  dataOrigin: string
  parentOrigin: string
  scope: string
  path?: string
}

export function buildPlatformRedirectUri(peerOrigin: string, path = '/'): string {
  const base = peerOrigin.replace(/\/$/, '')
  const normalizedPath = path === '/' || path === '' ? '/' : path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath === '/' ? '/' : normalizedPath}`
}

export function buildPlatformEmbedUrl({
  peerOrigin,
  path = '/',
  parentOrigin,
  scope = 'platform-nav',
  searchParams,
}: BuildPlatformEmbedUrlOptions): string {
  const base = peerOrigin.replace(/\/$/, '')
  const normalizedPath = path === '/' || path === '' ? '/' : path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${base}${normalizedPath === '/' ? '/' : normalizedPath}`)

  url.searchParams.set(PLATFORM_EMBED_QUERY.EMBED, PLATFORM_EMBED_QUERY.EMBED_VALUE)
  url.searchParams.set(PLATFORM_EMBED_QUERY.PARENT_ORIGIN, parentOrigin)
  url.searchParams.set(PLATFORM_EMBED_QUERY.SCOPE, scope)

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value)
    }
  }

  return url.toString()
}

export function buildIdentityUserPickerUrl({
  identityOrigin,
  parentOrigin,
  scope,
  path = '/user-picker',
  mode = 'single',
}: BuildIdentityUserPickerUrlOptions): string {
  return buildPlatformEmbedUrl({
    peerOrigin: identityOrigin,
    path,
    parentOrigin,
    scope,
    searchParams:
      mode === 'multiple' ? { [PLATFORM_EMBED_QUERY.MODE]: 'multiple' } : undefined,
  })
}

export function sendPlatformInit(
  iframe: HTMLIFrameElement,
  peerOrigin: string,
  accessToken: string,
): void {
  iframe.contentWindow?.postMessage(
    { type: PLATFORM_MESSAGE_TYPES.INIT, accessToken },
    peerOrigin,
  )
}

/** Shell → embedded peer: a confirmed AI write succeeded. */
export function sendPlatformAiMutation(
  iframe: HTMLIFrameElement,
  peerOrigin: string,
  toolName: string,
): void {
  const message: PlatformAiMutationMessage = {
    type: PLATFORM_MESSAGE_TYPES.AI_MUTATION,
    toolName,
  }
  iframe.contentWindow?.postMessage(message, peerOrigin)
}

/** Embedded app -> parent shell: first page content is fully loaded. */
export function sendPlatformContentReady(parentOrigin: string): void {
  if (typeof window === 'undefined') {
    return
  }
  window.parent.postMessage({ type: PLATFORM_MESSAGE_TYPES.CONTENT_READY }, parentOrigin)
}

export type SendPlatformNavigateOptions = {
  /**
   * Peer already navigated its SPA. Shell updates the URL without reloading
   * the iframe (see `PlatformServiceFrame`).
   */
  clientNavigated?: boolean
}

/** Embedded app -> parent shell: navigate the host SPA to a relative path. */
export function sendPlatformNavigate(
  parentOrigin: string,
  path: string,
  options?: SendPlatformNavigateOptions,
): void {
  if (typeof window === 'undefined' || !parentOrigin) {
    return
  }
  if (!path.startsWith('/') || path.startsWith('//')) {
    return
  }
  const message: PlatformNavigateMessage = {
    type: PLATFORM_MESSAGE_TYPES.NAVIGATE,
    path,
    ...(options?.clientNavigated ? { clientNavigated: true } : {}),
  }
  window.parent.postMessage(message, parentOrigin)
}

export function sendIdentityUserPickerSelect(
  parentOrigin: string,
  scope: string,
  user: IdentityUserPickerUser,
): void {
  if (typeof window === 'undefined') {
    return
  }

  const message: IdentityUserPickerSelectMessage = {
    type: IDENTITY_USER_PICKER_MESSAGE_TYPES.SELECT,
    scope,
    user,
  }
  window.parent.postMessage(message, parentOrigin)
}

export function sendIdentityUserPickerSelectionChange(
  parentOrigin: string,
  scope: string,
  users: IdentityUserPickerUser[],
): void {
  if (typeof window === 'undefined') {
    return
  }

  const message: IdentityUserPickerSelectionChangeMessage = {
    type: IDENTITY_USER_PICKER_MESSAGE_TYPES.SELECTION_CHANGE,
    scope,
    users,
  }
  window.parent.postMessage(message, parentOrigin)
}

export function sendIdentityUserPickerSetSelection(
  iframe: HTMLIFrameElement,
  peerOrigin: string,
  scope: string,
  users: IdentityUserPickerUser[],
): void {
  const message: IdentityUserPickerSetSelectionMessage = {
    type: IDENTITY_USER_PICKER_MESSAGE_TYPES.SET_SELECTION,
    scope,
    users,
  }
  iframe.contentWindow?.postMessage(message, peerOrigin)
}

export function sendIdentityUserPickerCancel(
  parentOrigin: string,
  scope: string,
  reason?: string,
): void {
  if (typeof window === 'undefined') {
    return
  }

  const message: IdentityUserPickerCancelMessage = {
    type: IDENTITY_USER_PICKER_MESSAGE_TYPES.CANCEL,
    scope,
    reason,
  }
  window.parent.postMessage(message, parentOrigin)
}

export function buildDataTagPickerUrl({
  dataOrigin,
  parentOrigin,
  scope,
  path = '/tag-picker',
  mode = 'single',
}: BuildDataTagPickerUrlOptions): string {
  return buildPlatformEmbedUrl({
    peerOrigin: dataOrigin,
    path,
    parentOrigin,
    scope,
    searchParams:
      mode === 'multiple' ? { [PLATFORM_EMBED_QUERY.MODE]: 'multiple' } : undefined,
  })
}

export function buildDataTagCreateUrl({
  dataOrigin,
  parentOrigin,
  scope,
  path = '/tag-create',
}: BuildDataTagCreateUrlOptions): string {
  return buildPlatformEmbedUrl({
    peerOrigin: dataOrigin,
    path,
    parentOrigin,
    scope,
  })
}

export function sendDataTagPickerSelectionChange(
  parentOrigin: string,
  scope: string,
  tags: DataTagPickerTag[],
): void {
  if (typeof window === 'undefined') {
    return
  }

  const message: DataTagPickerSelectionChangeMessage = {
    type: DATA_TAG_PICKER_MESSAGE_TYPES.SELECTION_CHANGE,
    scope,
    tags,
  }
  window.parent.postMessage(message, parentOrigin)
}

export function sendDataTagPickerSetSelection(
  iframe: HTMLIFrameElement,
  peerOrigin: string,
  scope: string,
  tags: DataTagPickerTag[],
): void {
  const message: DataTagPickerSetSelectionMessage = {
    type: DATA_TAG_PICKER_MESSAGE_TYPES.SET_SELECTION,
    scope,
    tags,
  }
  iframe.contentWindow?.postMessage(message, peerOrigin)
}

export function sendDataTagPickerCancel(
  parentOrigin: string,
  scope: string,
  reason?: string,
): void {
  if (typeof window === 'undefined') {
    return
  }

  const message: DataTagPickerCancelMessage = {
    type: DATA_TAG_PICKER_MESSAGE_TYPES.CANCEL,
    scope,
    reason,
  }
  window.parent.postMessage(message, parentOrigin)
}

export function sendDataTagPickerCreateRequest(parentOrigin: string, scope: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const message: DataTagPickerCreateRequestMessage = {
    type: DATA_TAG_PICKER_MESSAGE_TYPES.CREATE_REQUEST,
    scope,
  }
  window.parent.postMessage(message, parentOrigin)
}

export function sendDataTagPickerCreateSubmit(
  iframe: HTMLIFrameElement,
  peerOrigin: string,
  scope: string,
): void {
  const message: DataTagPickerCreateSubmitMessage = {
    type: DATA_TAG_PICKER_MESSAGE_TYPES.CREATE_SUBMIT,
    scope,
  }
  iframe.contentWindow?.postMessage(message, peerOrigin)
}

export function sendDataTagCreated(
  parentOrigin: string,
  scope: string,
  tag: DataTagPickerTag,
): void {
  if (typeof window === 'undefined') {
    return
  }

  const message: DataTagPickerCreatedMessage = {
    type: DATA_TAG_PICKER_MESSAGE_TYPES.CREATED,
    scope,
    tag,
  }
  window.parent.postMessage(message, parentOrigin)
}

export function sendPlatformMediaDialogRequest(
  parentOrigin: string,
  request: Omit<PlatformMediaDialogRequestMessage, 'type'>,
): void {
  if (typeof window === 'undefined') {
    return
  }

  window.parent.postMessage(
    {
      ...request,
      type: PLATFORM_MESSAGE_TYPES.MEDIA_DIALOG_REQUEST,
    },
    parentOrigin,
  )
}

export function sendPlatformMediaDialogResult(
  targetWindow: WindowProxy | null,
  targetOrigin: string,
  requestId: string,
  items: PlatformMediaDialogItem[],
): void {
  const message: PlatformMediaDialogResultMessage = {
    type: PLATFORM_MESSAGE_TYPES.MEDIA_DIALOG_RESULT,
    requestId,
    items,
  }

  targetWindow?.postMessage(message, targetOrigin)
}

export function sendPlatformMediaDialogCancel(
  targetWindow: WindowProxy | null,
  targetOrigin: string,
  requestId: string,
  reason?: string,
): void {
  const message: PlatformMediaDialogCancelMessage = {
    type: PLATFORM_MESSAGE_TYPES.MEDIA_DIALOG_CANCEL,
    requestId,
    reason,
  }

  targetWindow?.postMessage(message, targetOrigin)
}

export function sendPlatformPeerDialogRequest(
  parentOrigin: string,
  request: Omit<PlatformPeerDialogRequestMessage, 'type'>,
): void {
  if (typeof window === 'undefined') {
    return
  }

  window.parent.postMessage(
    {
      ...request,
      type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_REQUEST,
    },
    parentOrigin,
  )
}

export function sendPlatformPeerDialogResult(
  targetWindow: WindowProxy | null,
  targetOrigin: string,
  requestId: string,
  payload?: unknown,
): void {
  const message: PlatformPeerDialogResultMessage = {
    type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_RESULT,
    requestId,
    payload,
  }

  targetWindow?.postMessage(message, targetOrigin)
}

export function sendPlatformPeerDialogCancel(
  targetWindow: WindowProxy | null,
  targetOrigin: string,
  requestId: string,
  reason?: string,
): void {
  const message: PlatformPeerDialogCancelMessage = {
    type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_CANCEL,
    requestId,
    reason,
  }

  targetWindow?.postMessage(message, targetOrigin)
}

/** Dialog iframe → WebOnOne shell after successful save. */
export function sendPlatformPeerDialogComplete(
  parentOrigin: string,
  requestId: string,
  payload?: unknown,
): void {
  if (typeof window === 'undefined') {
    return
  }

  const message: PlatformPeerDialogCompleteMessage = {
    type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_COMPLETE,
    requestId,
    payload,
  }
  window.parent.postMessage(message, parentOrigin)
}

/**
 * Dialog iframe → WebOnOne shell when the user cancels from inside the form.
 * Host maps this to the page-iframe cancel responder.
 */
export function sendPlatformPeerDialogDismiss(
  parentOrigin: string,
  requestId: string,
  reason = 'cancelled',
): void {
  if (typeof window === 'undefined') {
    return
  }

  const message: PlatformPeerDialogCancelMessage = {
    type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_CANCEL,
    requestId,
    reason,
  }
  window.parent.postMessage(message, parentOrigin)
}

/** Shell → dialog iframe: footer primary button clicked. */
export function sendPlatformPeerDialogSubmit(
  targetWindow: WindowProxy | null,
  targetOrigin: string,
  requestId: string,
): void {
  const message: PlatformPeerDialogSubmitMessage = {
    type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_SUBMIT,
    requestId,
  }
  targetWindow?.postMessage(message, targetOrigin)
}

/** Shell → dialog iframe: footer secondary button clicked (e.g. Previous). */
export function sendPlatformPeerDialogSecondary(
  targetWindow: WindowProxy | null,
  targetOrigin: string,
  requestId: string,
): void {
  const message: PlatformPeerDialogSecondaryMessage = {
    type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_SECONDARY,
    requestId,
  }
  targetWindow?.postMessage(message, targetOrigin)
}

export type PlatformPeerDialogBusyOptions = {
  description?: string
  /** `null` hides the secondary button; omit to leave unchanged. */
  secondaryLabel?: string | null
}

/** Dialog iframe → shell: sync host footer busy state / chrome. */
export function sendPlatformPeerDialogBusy(
  parentOrigin: string,
  requestId: string,
  busy: boolean,
  submitLabel?: string,
  options?: PlatformPeerDialogBusyOptions,
): void {
  if (typeof window === 'undefined') {
    return
  }

  const message: PlatformPeerDialogBusyMessage = {
    type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_BUSY,
    requestId,
    busy,
    submitLabel,
    description: options?.description,
    secondaryLabel: options?.secondaryLabel,
  }
  window.parent.postMessage(message, parentOrigin)
}

/** Outer dialog iframe → shell: open stacked sibling create/form dialog. */
export function sendPlatformPeerDialogNestedRequest(
  parentOrigin: string,
  request: Omit<PlatformPeerDialogNestedRequestMessage, 'type'>,
): void {
  if (typeof window === 'undefined') {
    return
  }

  window.parent.postMessage(
    {
      ...request,
      type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_NESTED_REQUEST,
    },
    parentOrigin,
  )
}

/** Shell → outer dialog iframe: nested sibling cancelled. */
export function sendPlatformPeerDialogNestedCancel(
  targetWindow: WindowProxy | null,
  targetOrigin: string,
  parentRequestId: string,
  requestId: string,
  reason?: string,
): void {
  const message: PlatformPeerDialogNestedCancelMessage = {
    type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_NESTED_CANCEL,
    parentRequestId,
    requestId,
    reason,
  }
  targetWindow?.postMessage(message, targetOrigin)
}

/** Shell → outer dialog iframe: nested sibling completed. */
export function sendPlatformPeerDialogNestedResult(
  targetWindow: WindowProxy | null,
  targetOrigin: string,
  parentRequestId: string,
  requestId: string,
  payload?: unknown,
): void {
  const message: PlatformPeerDialogNestedResultMessage = {
    type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_NESTED_RESULT,
    parentRequestId,
    requestId,
    payload,
  }
  targetWindow?.postMessage(message, targetOrigin)
}

export function isPlatformEmbedMode(
  searchParams: URLSearchParams,
  isAllowedParentOrigin: (origin: string) => boolean,
): boolean {
  if (searchParams.get(PLATFORM_EMBED_QUERY.EMBED) !== PLATFORM_EMBED_QUERY.EMBED_VALUE) {
    return false
  }

  const parentOrigin = searchParams.get(PLATFORM_EMBED_QUERY.PARENT_ORIGIN)
  return Boolean(parentOrigin && isAllowedParentOrigin(parentOrigin))
}

export function getPlatformEmbedParentOrigin(
  searchParams: URLSearchParams,
  isAllowedParentOrigin: (origin: string) => boolean,
): string | null {
  if (!isPlatformEmbedMode(searchParams, isAllowedParentOrigin)) {
    return null
  }

  return searchParams.get(PLATFORM_EMBED_QUERY.PARENT_ORIGIN)
}

/** True when loaded as a platform embed iframe (auth via postMessage, not auth-code). */
export function hasPlatformEmbedHandoff(
  searchParams: URLSearchParams,
  isAllowedParentOrigin: (origin: string) => boolean,
): boolean {
  return isPlatformEmbedMode(searchParams, isAllowedParentOrigin)
}

export type SendAuthSuccessPayload = {
  accessToken: string
  expiresIn: number
  user: AuthSuccessUser
  embedId?: string
}

/** Identity login iframe → parent: JWT + public profile after successful sign-in. */
export function sendAuthSuccess(parentOrigin: string, payload: SendAuthSuccessPayload): void {
  if (typeof window === 'undefined' || !parentOrigin) {
    return
  }

  const message: AuthSuccessMessage = {
    type: AUTH_MESSAGE_TYPES.SUCCESS,
    accessToken: payload.accessToken,
    expiresIn: payload.expiresIn,
    user: payload.user,
    ...(payload.embedId !== undefined ? { embedId: payload.embedId } : {}),
  }
  window.parent.postMessage(message, parentOrigin)
}

/** Identity login iframe → parent: user cancelled (optional). */
export function sendAuthCancel(parentOrigin: string, embedId?: string): void {
  if (typeof window === 'undefined' || !parentOrigin) {
    return
  }

  const message: AuthCancelMessage = {
    type: AUTH_MESSAGE_TYPES.CANCEL,
    ...(embedId !== undefined ? { embedId } : {}),
  }
  window.parent.postMessage(message, parentOrigin)
}

export type SendAuthNavigatePayload = {
  pathname: string
  search?: string
}

/** Identity auth iframe → parent: navigate guest auth route in the host SPA. */
export function sendAuthNavigate(parentOrigin: string, payload: SendAuthNavigatePayload): void {
  if (typeof window === 'undefined' || !parentOrigin) {
    return
  }

  const message: AuthNavigateMessage = {
    type: AUTH_MESSAGE_TYPES.NAVIGATE,
    pathname: payload.pathname,
    ...(payload.search !== undefined ? { search: payload.search } : {}),
  }
  window.parent.postMessage(message, parentOrigin)
}

export type SendWebsiteSsoSessionPayload = {
  accessToken: string
  user: AuthSuccessUser
}

/** WebOnOne silent SSO iframe → website parent: existing app session. */
export function sendWebsiteSsoSession(
  parentOrigin: string,
  payload: SendWebsiteSsoSessionPayload,
): void {
  if (typeof window === 'undefined' || !parentOrigin) {
    return
  }

  const message: WebsiteSsoSessionMessage = {
    type: WEBSITE_SSO_MESSAGE_TYPES.SESSION,
    accessToken: payload.accessToken,
    user: payload.user,
  }
  window.parent.postMessage(message, parentOrigin)
}

/** WebOnOne silent SSO iframe → website parent: no app session. */
export function sendWebsiteSsoNone(parentOrigin: string): void {
  if (typeof window === 'undefined' || !parentOrigin) {
    return
  }

  const message: WebsiteSsoNoneMessage = {
    type: WEBSITE_SSO_MESSAGE_TYPES.NONE,
  }
  window.parent.postMessage(message, parentOrigin)
}

/** Hidden iframe src for website → WebOnOne silent SSO check. */
export function buildWebsiteSsoUrl(webononeOrigin: string, parentOrigin: string): string {
  const base = webononeOrigin.replace(/\/$/, '')
  const url = new URL(`${base}/auth/website-sso`)
  url.searchParams.set(PLATFORM_EMBED_QUERY.PARENT_ORIGIN, parentOrigin)
  return url.toString()
}

export type SendIdentitySsoSessionPayload = {
  accessToken: string
  user: AuthSuccessUser
}

/** Identity silent SSO iframe → consumer parent: existing Identity session. */
export function sendIdentitySsoSession(
  parentOrigin: string,
  payload: SendIdentitySsoSessionPayload,
): void {
  if (typeof window === 'undefined' || !parentOrigin) {
    return
  }

  const message: IdentitySsoSessionMessage = {
    type: IDENTITY_SSO_MESSAGE_TYPES.SESSION,
    accessToken: payload.accessToken,
    user: payload.user,
  }
  window.parent.postMessage(message, parentOrigin)
}

/** Identity silent SSO iframe → consumer parent: no Identity session. */
export function sendIdentitySsoNone(parentOrigin: string): void {
  if (typeof window === 'undefined' || !parentOrigin) {
    return
  }

  const message: IdentitySsoNoneMessage = {
    type: IDENTITY_SSO_MESSAGE_TYPES.NONE,
  }
  window.parent.postMessage(message, parentOrigin)
}

/** Hidden iframe src for consumer → Identity silent SSO check. */
export function buildIdentitySilentSsoUrl(identityOrigin: string, parentOrigin: string): string {
  const base = identityOrigin.replace(/\/$/, '')
  const url = new URL(`${base}/auth/silent-sso`)
  url.searchParams.set(PLATFORM_EMBED_QUERY.PARENT_ORIGIN, parentOrigin)
  return url.toString()
}

/** Identity clear-embed-session iframe → consumer: partitioned local session cleared. */
export function sendIdentitySessionCleared(parentOrigin: string): void {
  if (typeof window === 'undefined' || !parentOrigin) {
    return
  }

  const message: IdentitySessionClearedMessage = {
    type: IDENTITY_CLEAR_MESSAGE_TYPES.CLEARED,
  }
  window.parent.postMessage(message, parentOrigin)
}

/** Hidden iframe src to clear Identity storage under the consumer top-level site. */
export function buildIdentityClearEmbedSessionUrl(
  identityOrigin: string,
  parentOrigin: string,
): string {
  const base = identityOrigin.replace(/\/$/, '')
  const url = new URL(`${base}/auth/clear-embed-session`)
  url.searchParams.set(PLATFORM_EMBED_QUERY.PARENT_ORIGIN, parentOrigin)
  return url.toString()
}

const DEFAULT_CLEAR_EMBED_TIMEOUT_MS = 2000

/**
 * Mount a hidden Identity clear-embed-session iframe, wait for cleared (or timeout),
 * then remove it. Clears the storage partition used by login/SSO iframes under this consumer.
 */
export function clearIdentityEmbedSession(options: {
  identityOrigin: string
  parentOrigin?: string
  timeoutMs?: number
}): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve()
  }

  const identityOrigin = options.identityOrigin.replace(/\/$/, '')
  const parentOrigin = (options.parentOrigin ?? window.location.origin).replace(/\/$/, '')
  const timeoutMs = options.timeoutMs ?? DEFAULT_CLEAR_EMBED_TIMEOUT_MS
  const src = buildIdentityClearEmbedSessionUrl(identityOrigin, parentOrigin)

  return new Promise((resolve) => {
    let settled = false
    const iframe = document.createElement('iframe')
    iframe.title = 'Identity clear embed session'
    iframe.setAttribute('aria-hidden', 'true')
    iframe.tabIndex = -1
    iframe.style.cssText =
      'position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none;'

    function finish() {
      if (settled) {
        return
      }
      settled = true
      window.clearTimeout(timeoutId)
      window.removeEventListener('message', onMessage)
      iframe.remove()
      resolve()
    }

    function onMessage(event: MessageEvent) {
      if (event.origin.replace(/\/$/, '') !== identityOrigin) {
        return
      }
      if (isIdentitySessionClearedMessage(event.data)) {
        finish()
      }
    }

    window.addEventListener('message', onMessage)
    const timeoutId = window.setTimeout(finish, timeoutMs)
    iframe.src = src
    document.body.appendChild(iframe)
  })
}
