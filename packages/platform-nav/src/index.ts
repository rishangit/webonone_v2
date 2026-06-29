export { redirectWithAuthCode } from './authCodeRedirect'
export { buildLoginRedirectUrl, consumeOAuthState } from './loginRedirect'
export { parseReturnUrl, stripAuthCodeFromSearch } from './returnUrl'
export { resolvePlatformLogoutLoginUrl } from './platformLogout'
export {
  matchesAllowedOrigin,
  matchesRedirectUri,
  parseAllowlistPatterns,
} from './redirectAllowlist'
export { useServiceRedirect } from './useServiceRedirect'
export { DEFAULT_OAUTH_STATE_PREFIX, QUERY } from './constants'
export {
  CORE_NAV_QUERY_PARAM,
  CORE_NAV_VARIANT_MAIN,
  CORE_NAV_VARIANT_SUPER_ADMIN,
  MAIN_PLATFORM_NAV,
  SUPER_ADMIN_PLATFORM_NAV,
  getCoreOriginFromReturnUrl,
  getPlatformNavDefs,
  parsePlatformNavVariant,
  resolvePlatformNavUrls,
  toCoreNavQueryValue,
} from './coreNav'
export type {
  BuildLoginRedirectOptions,
  OAuthStatePayload,
  RedirectWithAuthCodeOptions,
} from './types'
export type {
  CoreNavDef,
  CoreNavGroup,
  CoreNavLeaf,
  ExternalServiceId,
  PlatformNavVariant,
  ResolvedCoreNavDef,
  ResolvedCoreNavGroup,
  ResolvedCoreNavLeaf,
} from './coreNav'
