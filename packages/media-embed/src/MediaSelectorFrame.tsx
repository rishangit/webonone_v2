import { forwardRef, type ComponentProps } from 'react'
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

export const MediaSelectorFrame = forwardRef<HTMLIFrameElement, SelectorFrameProps>(
  function MediaSelectorFrame(
    {
      baseUrl,
      parentOrigin,
      scope,
      folderPath,
      mode,
      accept,
      maxFiles,
      maxSizeBytes,
      selectorUpload,
      cropAspectPresets,
      ...rest
    },
    ref,
  ) {
    return (
      <MediaSelectorFrameBase
        {...rest}
        ref={ref}
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
          selectorUpload,
          cropAspectPresets,
        }}
      />
    )
  },
)
