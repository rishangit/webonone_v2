import {
  DATA_TAG_PICKER_MESSAGE_TYPES,
  IDENTITY_USER_PICKER_MESSAGE_TYPES,
  PLATFORM_EMBED_QUERY,
  PLATFORM_MESSAGE_TYPES,
} from './types'
import type {
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
  PlatformPeerDialogCancelMessage,
  PlatformPeerDialogCompleteMessage,
  PlatformPeerDialogBusyMessage,
  PlatformPeerDialogRequestMessage,
  PlatformPeerDialogResultMessage,
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

/** Embedded app -> parent shell: first page content is fully loaded. */
export function sendPlatformContentReady(parentOrigin: string): void {
  if (typeof window === 'undefined') {
    return
  }
  window.parent.postMessage({ type: PLATFORM_MESSAGE_TYPES.CONTENT_READY }, parentOrigin)
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

/** Dialog iframe → shell: sync host footer busy state / submit label. */
export function sendPlatformPeerDialogBusy(
  parentOrigin: string,
  requestId: string,
  busy: boolean,
  submitLabel?: string,
): void {
  if (typeof window === 'undefined') {
    return
  }

  const message: PlatformPeerDialogBusyMessage = {
    type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_BUSY,
    requestId,
    busy,
    submitLabel,
  }
  window.parent.postMessage(message, parentOrigin)
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
