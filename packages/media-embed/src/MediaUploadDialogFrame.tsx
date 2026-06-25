import type { ComponentProps } from 'react'
import { createMediaEmbedFrame } from './MediaEmbedFrame'
import { buildMediaUploadDialogUrl } from './embedUrl'
import type { BuildMediaUploadDialogUrlOptions } from './types'

type UploadDialogFrameProps = Omit<
  ComponentProps<ReturnType<typeof createMediaEmbedFrame<BuildMediaUploadDialogUrlOptions>>>,
  'buildSrc' | 'urlOptions'
> &
  BuildMediaUploadDialogUrlOptions

export const MediaUploadDialogFrameBase = createMediaEmbedFrame<BuildMediaUploadDialogUrlOptions>(
  'Media upload',
)

export function MediaUploadDialogFrame({
  baseUrl,
  parentOrigin,
  scope,
  folderPath,
  mediaType,
  crop,
  defaultCropAspect,
  autoClose,
  mode,
  accept,
  maxFiles,
  maxSizeBytes,
  ...rest
}: UploadDialogFrameProps) {
  return (
    <MediaUploadDialogFrameBase
      {...rest}
      buildSrc={buildMediaUploadDialogUrl}
      urlOptions={{
        baseUrl,
        parentOrigin,
        scope,
        folderPath,
        mediaType,
        crop,
        defaultCropAspect,
        autoClose,
        mode,
        accept,
        maxFiles,
        maxSizeBytes,
      }}
    />
  )
}
