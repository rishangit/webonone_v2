import type { ComponentProps } from 'react'
import { createMediaEmbedFrame } from './MediaEmbedFrame'
import { buildMediaViewerUrl } from './embedUrl'
import type { BuildMediaViewerUrlOptions } from './types'

type ViewerFrameProps = Omit<
  ComponentProps<ReturnType<typeof createMediaEmbedFrame<BuildMediaViewerUrlOptions>>>,
  'buildSrc' | 'urlOptions'
> &
  BuildMediaViewerUrlOptions

export const MediaViewerFrameBase = createMediaEmbedFrame<BuildMediaViewerUrlOptions>('Media viewer')

export function MediaViewerFrame({
  baseUrl,
  parentOrigin,
  scope,
  fileUrl,
  mediaId,
  mode,
  ...rest
}: ViewerFrameProps) {
  return (
    <MediaViewerFrameBase
      {...rest}
      buildSrc={buildMediaViewerUrl}
      urlOptions={{
        baseUrl,
        parentOrigin,
        scope,
        fileUrl,
        mediaId,
        mode,
      }}
    />
  )
}
