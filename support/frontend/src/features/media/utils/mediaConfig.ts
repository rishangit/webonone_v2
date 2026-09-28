const DEFAULT_MEDIA_ORIGIN = 'http://127.0.0.1:3013'

export function getMediaOrigin(): string {
  const raw = import.meta.env.VITE_MEDIA_ORIGIN
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim().replace(/\/$/, '')
  }
  return DEFAULT_MEDIA_ORIGIN
}

export function getMediaSelectorUrl(): string {
  return `${getMediaOrigin()}/selector`
}

/** Scope support:feedback:{uploadSessionId} → disk support/feedbacks/{uploadSessionId}/ */
export function buildSupportFeedbackMediaScope(uploadSessionId: string): string {
  return `support:feedback:${uploadSessionId}`
}

export const FEEDBACK_SCREENSHOT_ACCEPT = 'image/*'

export const FEEDBACK_SCREENSHOT_FOLDER_PATH = '/'
