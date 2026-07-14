export {
  PLATFORM_EMBED_QUERY,
  PLATFORM_MESSAGE_TYPES,
  isPlatformContentReadyMessage,
  isPlatformInitMessage,
  isPlatformReadyMessage,
  type BuildPlatformEmbedUrlOptions,
  type PlatformContentReadyMessage,
  type PlatformEmbedMessage,
  type PlatformInitMessage,
  type PlatformReadyMessage,
} from './types'

export {
  buildPlatformEmbedUrl,
  buildPlatformRedirectUri,
  getPlatformEmbedParentOrigin,
  hasPlatformEmbedHandoff,
  isPlatformEmbedMode,
  sendPlatformContentReady,
  sendPlatformInit,
} from './embedUrl'

export {
  clearPlatformEmbedSession,
  isPlatformEmbedContext,
  persistPlatformEmbedSessionFromUrl,
  resolvePlatformEmbedParentOrigin,
  type PlatformEmbedSession,
} from './embedSession'

export {
  decodeJwtPayload,
  isAccessTokenExpired,
  type AccessTokenClaims,
  type PlatformRole,
} from './jwtClaims'

export { PlatformEmbedShell } from './PlatformEmbedShell'
export { PlatformServiceFrame, type PlatformServiceFrameProps } from './PlatformServiceFrame'
export { usePlatformEmbedCanvas, ensurePlatformEmbedCanvas, PLATFORM_EMBED_APP_HOST_CLASS, PLATFORM_EMBED_CANVAS_CLASS, PLATFORM_EMBED_ROOT_CLASS } from './usePlatformEmbedCanvas'
export { usePlatformEmbedAuth, type UsePlatformEmbedAuthOptions, type UsePlatformEmbedAuthResult } from './usePlatformEmbedAuth'
export {
  usePlatformEmbedContentReady,
  type UsePlatformEmbedContentReadyOptions,
  type UsePlatformEmbedContentReadyResult,
} from './usePlatformEmbedContentReady'
