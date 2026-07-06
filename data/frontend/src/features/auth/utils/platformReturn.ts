import { hasPlatformEmbedHandoff as checkPlatformEmbedHandoff } from '@webonone/platform-embed'
import { parseReturnUrl, stripAuthCodeFromSearch } from '@webonone/platform-nav'
import { isAllowedParentOrigin, parseAllowedParentOrigins } from './identityConfig'

export function parsePlatformReturnUrl(searchParams: URLSearchParams): string | null {
  return parseReturnUrl(searchParams, parseAllowedParentOrigins())
}

export function buildPlatformSearchWithoutCode(searchParams: URLSearchParams): string {
  return stripAuthCodeFromSearch(searchParams)
}

export function isPlatformAuthCodeHandoff(searchParams: URLSearchParams): boolean {
  return Boolean(searchParams.get('code') && !searchParams.get('state'))
}

export function hasPlatformEmbedHandoff(searchParams: URLSearchParams): boolean {
  return checkPlatformEmbedHandoff(searchParams, isAllowedParentOrigin)
}

export function hasPlatformHandoff(searchParams: URLSearchParams): boolean {
  return isPlatformAuthCodeHandoff(searchParams) && Boolean(parsePlatformReturnUrl(searchParams))
}

export function hasAnyPlatformHandoff(searchParams: URLSearchParams): boolean {
  return hasPlatformHandoff(searchParams) || hasPlatformEmbedHandoff(searchParams)
}
