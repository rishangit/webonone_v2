export {
  PLATFORM_EMBED_QUERY,
  PLATFORM_MESSAGE_TYPES,
  isPlatformInitMessage,
  isPlatformReadyMessage,
  type BuildPlatformEmbedUrlOptions,
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
  sendPlatformInit,
} from './embedUrl'

export {
  clearPlatformEmbedSession,
  isPlatformEmbedContext,
  persistPlatformEmbedSessionFromUrl,
  resolvePlatformEmbedParentOrigin,
  type PlatformEmbedSession,
} from './embedSession'

export { PlatformEmbedShell } from './PlatformEmbedShell'
export { PlatformServiceFrame, type PlatformServiceFrameProps } from './PlatformServiceFrame'
export { usePlatformEmbedCanvas, ensurePlatformEmbedCanvas, PLATFORM_EMBED_APP_HOST_CLASS, PLATFORM_EMBED_CANVAS_CLASS, PLATFORM_EMBED_ROOT_CLASS } from './usePlatformEmbedCanvas'
export { usePlatformEmbedListener } from './usePlatformEmbedListener'
