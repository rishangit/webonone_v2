export interface EmbedPostMessageResize {
  type: 'webonone:embed:resize'
  height: number
  embedId?: string
}

export interface EmbedPostMessageAuthSuccess {
  type: 'webonone:auth:success'
  accessToken: string
  expiresIn: number
  user: { id: string; email: string; displayName: string }
  embedId?: string
}

export interface EmbedPostMessageAuthCancel {
  type: 'webonone:auth:cancel'
  embedId?: string
}

export type EmbedPostMessage =
  | EmbedPostMessageResize
  | EmbedPostMessageAuthSuccess
  | EmbedPostMessageAuthCancel
