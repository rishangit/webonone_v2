import type { ComponentProps } from 'react'
import { createMediaEmbedFrame } from './MediaEmbedFrame'
import { buildMediaSelectorUrl } from './embedUrl'
import type { BuildMediaSelectorUrlOptions } from './types'

type SelectorFrameProps = Omit<
  ComponentProps<ReturnType<typeof createMediaEmbedFrame<BuildMediaSelectorUrlOptions>>>,
  'buildSrc' | 'urlOptions'
> &
  BuildMediaSelectorUrlOptions

export const MediaSelectorFrameBase = createMediaEmbedFrame<BuildMediaSelectorUrlOptions>(
  'Media selector',
)

export function MediaSelectorFrame({
  baseUrl,
  parentOrigin,
  scope,
  folderPath,
  mode,
  accept,
  maxFiles,
  maxSizeBytes,
  ...rest
}: SelectorFrameProps) {
  return (
    <MediaSelectorFrameBase
      {...rest}
      buildSrc={buildMediaSelectorUrl}
      urlOptions={{
        baseUrl,
        parentOrigin,
        scope,
        folderPath,
        mode,
        accept,
        maxFiles,
        maxSizeBytes,
      }}
    />
  )
}
