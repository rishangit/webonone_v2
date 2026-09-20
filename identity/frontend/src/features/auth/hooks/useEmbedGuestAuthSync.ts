import { useEmbedLocaleListener } from '@webonone/i18n'
import { useEmbedThemeListener } from '@webonone/theme'
import { useEmbedLoginMode } from './useEmbedLoginMode'

/**
 * Sync theme + locale from an allowlisted parent (WebOnOne guest auth shell).
 */
export function useEmbedGuestAuthSync() {
  const { isEmbed, parentOrigin } = useEmbedLoginMode()
  const origin = isEmbed ? parentOrigin : null
  useEmbedThemeListener(origin)
  useEmbedLocaleListener(origin)
}
