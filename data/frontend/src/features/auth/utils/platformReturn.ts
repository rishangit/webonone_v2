import { hasPlatformEmbedHandoff as checkPlatformEmbedHandoff } from '@webonone/platform-embed'
import { hasPlatformRedirectHandoff, parseReturnUrl, stripAuthCodeFromSearch } from '@webonone/platform-nav'
import { isAllowedParentOrigin, parseAllowedParentOrigins } from './identityConfig'

export function parsePlatformReturnUrl(searchParams: URLSearchParams): string | null {
  return parseReturnUrl(searchParams, parseAllowedParentOrigins())
}

export function buildPlatformSearchWithoutCode(searchParams: URLSearchParams): string {
  return stripAuthCodeFromSearch(searchParams)
}

export function hasPlatformHandoff(searchParams: URLSearchParams): boolean {
  return hasPlatformRedirectHandoff(searchParams, parseAllowedParentOrigins())
}

export function hasPlatformEmbedHandoff(searchParams: URLSearchParams): boolean {
  return checkPlatformEmbedHandoff(searchParams, isAllowedParentOrigin)
}

export function hasAnyPlatformHandoff(searchParams: URLSearchParams): boolean {
  return hasPlatformHandoff(searchParams) || hasPlatformEmbedHandoff(searchParams)
}
