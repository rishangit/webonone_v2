/**
 * Login / legacy embed message shapes.
 * Auth success/cancel are defined canonically in `@webonone/platform-embed`.
 */
export type {
  AuthCancelMessage,
  AuthCancelMessage as EmbedPostMessageAuthCancel,
  AuthSuccessMessage,
  AuthSuccessMessage as EmbedPostMessageAuthSuccess,
} from '@webonone/platform-embed'

export interface EmbedPostMessageResize {
  type: 'webonone:embed:resize'
  height: number
  embedId?: string
}
