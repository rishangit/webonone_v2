import {
  clearServiceAuthSession,
  readServiceAuthSession,
  writeServiceAuthSession,
} from '@webonone/platform-embed'
import type { WebsiteUser } from '@/features/auth/types/auth.types'

export const WEBSITE_AUTH_STORAGE_KEY = 'website_auth'

export type WebsiteAuthSession = {
  accessToken: string
  user: WebsiteUser
}

export function readWebsiteAuthSession(): WebsiteAuthSession | null {
  return readServiceAuthSession<WebsiteUser>(WEBSITE_AUTH_STORAGE_KEY)
}

export function writeWebsiteAuthSession(session: WebsiteAuthSession): void {
  writeServiceAuthSession(WEBSITE_AUTH_STORAGE_KEY, session)
}

export function clearWebsiteAuthSession(): void {
  clearServiceAuthSession(WEBSITE_AUTH_STORAGE_KEY)
}
