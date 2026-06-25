import type { ComponentProps } from 'react'
import { createMediaEmbedFrame } from './MediaEmbedFrame'
import { buildMediaDialogUrl } from './embedUrl'
import type { BuildMediaDialogUrlOptions } from './types'

type DialogFrameProps = Omit<
  ComponentProps<ReturnType<typeof createMediaEmbedFrame<BuildMediaDialogUrlOptions>>>,
  'buildSrc' | 'urlOptions'
> &
  BuildMediaDialogUrlOptions

export const MediaDialogFrameBase = createMediaEmbedFrame<BuildMediaDialogUrlOptions>('Media library')

export function MediaDialogFrame({
  baseUrl,
  parentOrigin,
  scope,
  folderPath,
  selectable,
  mode,
  accept,
  maxFiles,
  maxSizeBytes,
  ...rest
}: DialogFrameProps) {
  return (
    <MediaDialogFrameBase
      {...rest}
      buildSrc={buildMediaDialogUrl}
      urlOptions={{
        baseUrl,
        parentOrigin,
        scope,
        folderPath,
        selectable,
        mode,
        accept,
        maxFiles,
        maxSizeBytes,
      }}
    />
  )
}
