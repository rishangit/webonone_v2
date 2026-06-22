export type RedirectWithAuthCodeOptions = {
  accessToken: string
  authCodeEndpoint: string
  targetUrl: string
  returnUrl?: string
  state?: string
  extraSearchParams?: Record<string, string>
  errorMessage?: string
}

export type BuildLoginRedirectOptions = {
  loginUrl: string
  redirectUri: string
  returnPath?: string
  stateStorageKeyPrefix?: string
  extraSearchParams?: Record<string, string>
}

export type OAuthStatePayload = {
  returnPath: string
}
