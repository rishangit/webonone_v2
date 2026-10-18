import {
  resolvePlatformEmbedParentOrigin,
  sendPlatformAiEntityContext,
  type PlatformAiEntityRef,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'

export function copyEntityToAi(
  searchParams: URLSearchParams,
  entity: PlatformAiEntityRef,
): boolean {
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  if (!parentOrigin) {
    return false
  }
  sendPlatformAiEntityContext(parentOrigin, entity, { openAssistant: true })
  return true
}
