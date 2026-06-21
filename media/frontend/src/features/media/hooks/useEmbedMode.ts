import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'

export type EmbedMode = 'single' | 'multiple'

export interface EmbedModeState {
  isEmbed: boolean
  parentOrigin: string | null
  scope: string | null
  mode: EmbedMode
  accept: string
  folderPath: string
  maxFiles: number
}

export function useEmbedMode(): EmbedModeState {
  const [searchParams] = useSearchParams()

  return useMemo(() => {
    const parentOrigin = searchParams.get('parentOrigin')
    const scope = searchParams.get('scope')
    const isEmbed = Boolean(
      parentOrigin && scope && isAllowedParentOrigin(parentOrigin),
    )

    const modeParam = searchParams.get('mode')
    const mode: EmbedMode = modeParam === 'multiple' ? 'multiple' : 'single'
    const accept = searchParams.get('accept') ?? '*/*'
    const folderPath = searchParams.get('folderPath') ?? '/'
    const maxFiles = Math.min(Number(searchParams.get('maxFiles') ?? 10), 50)

    return {
      isEmbed,
      parentOrigin: isEmbed ? parentOrigin : null,
      scope: isEmbed ? scope : null,
      mode,
      accept,
      folderPath,
      maxFiles,
    }
  }, [searchParams])
}
