export { redirectWithAuthCode } from './authCodeRedirect'
export { exchangeAuthCode, type ExchangeAuthCodeOptions, type ExchangeAuthCodeResult, type ExchangeAuthCodeUser, type PlatformRole as ExchangePlatformRole } from './exchangeAuthCode'
export { createNavItemNavigate, parseNavTarget } from './clientNav'
export type { NavItemNavigateHandler, NavTarget } from './clientNav'
export { buildLoginRedirectUrl, consumeOAuthState } from './loginRedirect'
export { parseReturnUrl, stripAuthCodeFromSearch, hasPlatformRedirectHandoff } from './returnUrl'
export { resolvePlatformLogoutLoginUrl, resolveAbsolutePostLogoutLoginUrl, buildIdentityLogoutUrl, performPlatformLogout } from './platformLogout'
export type { PlatformLogoutOptions } from './platformLogout'
export {
  matchesAllowedOrigin,
  matchesRedirectUri,
  parseAllowlistPatterns,
} from './redirectAllowlist'
export { useServiceRedirect } from './useServiceRedirect'
export {
  usePlatformRedirectBootstrap,
  type PlatformRedirectBootstrapState,
  type UsePlatformRedirectBootstrapOptions,
} from './usePlatformRedirectBootstrap'
export { DEFAULT_OAUTH_STATE_PREFIX, QUERY } from './constants'
export {
  CORE_NAV_QUERY_PARAM,
  CORE_NAV_VARIANT_COMPANY_ADMIN,
  CORE_NAV_VARIANT_MAIN,
  CORE_NAV_VARIANT_MEMBER,
  CORE_NAV_VARIANT_SUPER_ADMIN,
  EMAIL_NAV_SENTINELS,
  emailSentinelToExternalPath,
  isEmailNavSentinel,
  DATA_NAV_SENTINELS,
  dataSentinelToExternalPath,
  isDataNavSentinel,
  PROFILE_NAV_SENTINEL,
  profileSentinelToExternalPath,
  isProfileNavSentinel,
  IDENTITY_NAV_SENTINELS,
  identitySentinelToExternalPath,
  isIdentityNavSentinel,
  SMS_NAV_SENTINELS,
  smsSentinelToExternalPath,
  isSmsNavSentinel,
  MAIN_PLATFORM_NAV,
  MEMBER_PLATFORM_NAV,
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
