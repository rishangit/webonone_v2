import { parseReturnUrl, stripAuthCodeFromSearch } from '@webonone/platform-nav'
import { parseAllowedParentOrigins } from './identityConfig'

export function parsePlatformReturnUrl(searchParams: URLSearchParams): string | null {
  return parseReturnUrl(searchParams, parseAllowedParentOrigins())
}

export function buildPlatformSearchWithoutCode(searchParams: URLSearchParams): string {
  return stripAuthCodeFromSearch(searchParams)
}

export function isPlatformAuthCodeHandoff(searchParams: URLSearchParams): boolean {
  return Boolean(searchParams.get('code') && !searchParams.get('state'))
}

export function hasPlatformHandoff(searchParams: URLSearchParams): boolean {
  return isPlatformAuthCodeHandoff(searchParams) && Boolean(parsePlatformReturnUrl(searchParams))
}
