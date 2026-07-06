export const PLATFORM_EMBED_QUERY = {
  EMBED: 'embed',
  EMBED_VALUE: 'platform',
  PARENT_ORIGIN: 'parentOrigin',
  SCOPE: 'scope',
} as const

export const PLATFORM_MESSAGE_TYPES = {
  INIT: 'webonone:platform:init',
  READY: 'webonone:platform:ready',
} as const

export type PlatformInitMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.INIT
  accessToken: string
}

export type PlatformReadyMessage = {
  type: typeof PLATFORM_MESSAGE_TYPES.READY
}

export type PlatformEmbedMessage = PlatformInitMessage | PlatformReadyMessage

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
