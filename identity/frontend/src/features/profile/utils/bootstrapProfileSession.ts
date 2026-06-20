import { authApi } from '@/features/auth/services/authApi'
import { getIdentityProfileRedirectUri } from './profileConfig'

export async function bootstrapProfileSession(code: string) {
  const redirectUri = getIdentityProfileRedirectUri()
  return authApi.exchangeCode(code, redirectUri)
}
